import request from "supertest";
import initApp from "../server";
import userModel from "../modules/users/User";
import * as userUtils from "../modules/users/userUtils";
import * as tokenService from "../utils/tokenService";
import * as otpService from "../utils/otpService";
import bcrypt from "bcrypt";

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: "sub123",
        email: "user@example.com",
        given_name: "Test",
        family_name: "User",
        picture: "pic_url",
      }),
    }),
  })),
  JWT: jest.fn(),
}));

jest.mock("../modules/users/User");
jest.mock("../modules/users/userUtils");
jest.mock("../utils/tokenService");
jest.mock("../utils/otpService");
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

let app: any;

beforeAll(async () => {
  app = await initApp();
});

beforeEach(() => {
  jest.clearAllMocks();

  // Mocks for bcrypt
  (bcrypt.genSalt as jest.Mock) = jest.fn().mockResolvedValue("salt");
  (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue("hashedPassword");
  (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);

  // Mocks for tokenService
  (tokenService.generateToken as jest.Mock) = jest.fn().mockReturnValue({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  });

  // Mocks for otpService
  (otpService.generateOtp as jest.Mock) = jest.fn().mockReturnValue({
    otp: "123456",
    otpExpires: new Date(Date.now() + 5 * 60000),
  });
  (otpService.sendOtpMail as jest.Mock) = jest.fn().mockResolvedValue(true);

  // Mock createUserWithDefaults
  (userUtils.createUserWithDefaults as jest.Mock) = jest.fn().mockImplementation(async (userData) => {
    return {
      _id: "user123",
      ...userData,
      save: jest.fn().mockResolvedValue(true),
    };
  });

  // Default userModel.findOne mock (can override in tests)
  (userModel.findOne as jest.Mock) = jest.fn().mockResolvedValue({
    _id: "user123",
    email: "user@example.com",
    password: "hashedPassword",
    isVerified: true,
    refreshToken: "",
    save: jest.fn().mockResolvedValue(true),
    otp: "123456",
    otpExpires: new Date(Date.now() + 5 * 60000),
  });
});

describe("Auth Controller", () => {
  // --- Google Sign-In ---
  test("Google sign-in - new user registration and token generation", async () => {
    const res = await request(app).post("/api/auth/google").send({
      idToken: "valid-token",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("_id");
  });

  test("Google sign-in - invalid token payload", async () => {
    const mockOAuth2Client = require("google-auth-library").OAuth2Client.mock.instances[0];
    mockOAuth2Client.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => null,
    });

    const res = await request(app).post("/api/auth/google").send({
      idToken: "invalid-token",
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain("Invalid Google ID token");
  });

  test("Google sign-in - missing required Google profile fields", async () => {
    const mockOAuth2Client = require("google-auth-library").OAuth2Client.mock.instances[0];
    mockOAuth2Client.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: "sub123",
        email: null,
        given_name: null,
        family_name: null,
        picture: "pic_url",
      }),
    });

    const res = await request(app).post("/api/auth/google").send({
      idToken: "missing-fields-token",
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain("Google account missing required profile information");
  });

  test("Google sign-in - createUserWithDefaults throws error", async () => {
    (userUtils.createUserWithDefaults as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).post("/api/auth/google").send({
      idToken: "valid-token",
    });
    expect(res.status).toBe(400);
  });

  // --- Register ---
  test("Register - success and OTP sent", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "user@example.com",
        password: "12345678",
      });
    expect(res.status).toBe(200);
    expect(otpService.sendOtpMail).toHaveBeenCalled();
  });

  test("Register - error during user creation", async () => {
    (userUtils.createUserWithDefaults as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "fail@example.com",
        password: "12345678",
      });
    expect(res.status).toBe(400);
  });

  test("Register - missing password should fail", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "user@example.com",
        password: "",
      });
    expect(res.status).toBe(400);
  });

  // --- Login ---
  test("Login - success", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user@example.com",
        password: "12345678",
      });
    expect(res.status).toBe(200);
    expect(tokenService.generateToken).toHaveBeenCalled();
  });

  test("Login - user not found", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "12345678",
      });
    expect(res.status).toBe(400);
  });

  test("Login - user not verified", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValueOnce({
      isVerified: false,
      email: "user@example.com",
      password: "hashedPassword",
      save: jest.fn(),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user@example.com",
        password: "12345678",
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verify your email/);
  });

  test("Login - invalid password", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user@example.com",
        password: "wrongpass",
      });
    expect(res.status).toBe(400);
  });

  test("Login - no TOKEN_SECRET env var returns 500", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "12345678" });

    expect(res.status).toBe(500);

    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  // --- Logout ---
  test("Logout - success", async () => {
    (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockResolvedValue({
      save: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post("/api/auth/logout").send({
      refreshToken: "valid-refresh-token",
    });
    expect(res.status).toBe(200);
  });

  test("Logout - missing refresh token", async () => {
    const res = await request(app).post("/api/auth/logout").send({});
    expect(res.status).toBe(400);
  });

  test("Logout - failure on verifyRefreshToken", async () => {
    (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockRejectedValue(new Error("fail"));

    const res = await request(app).post("/api/auth/logout").send({
      refreshToken: "invalid-refresh-token",
    });
    expect(res.status).toBe(400);
  });

  // --- Refresh tokens ---
  test("Refresh - success", async () => {
    (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockResolvedValue({
      _id: "user123",
      email: "user@example.com",
      save: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "valid-refresh-token",
    });
    expect(res.status).toBe(200);
  });

  test("Refresh - missing token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  test("Refresh - invalid token", async () => {
    (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(null);

    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalid-refresh-token",
    });
    expect(res.status).toBe(401);
  });

  test("Refresh - failed token generation", async () => {
    (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockResolvedValue({
      _id: "user123",
      email: "user@example.com",
      save: jest.fn().mockResolvedValue(true),
    });
    (tokenService.generateToken as jest.Mock) = jest.fn().mockReturnValue(null);

    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "valid-refresh-token",
    });
    expect(res.status).toBe(500);
  });

  // --- Verify OTP ---
  test("Verify OTP - success", async () => {
    const res = await request(app).post("/api/auth/verify-otp").send({
      email: "user@example.com",
      otp: "123456",
    });
    expect(res.status).toBe(200);
  });

  test("Verify OTP - missing fields", async () => {
    const res = await request(app).post("/api/auth/verify-otp").send({
      email: "user@example.com",
    });
    expect(res.status).toBe(400);
  });

  test("Verify OTP - invalid OTP", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValueOnce({
      otp: "654321",
      otpExpires: new Date(Date.now() - 60000),
    });

    const res = await request(app).post("/api/auth/verify-otp").send({
      email: "user@example.com",
      otp: "123456",
    });
    expect(res.status).toBe(400);
  });

  // --- Resend OTP ---
  test("Resend OTP - success", async () => {
    const res = await request(app).post("/api/auth/resend-otp").send({
      email: "user@example.com",
    });
    expect(res.status).toBe(200);
  });

  test("Resend OTP - missing email", async () => {
    const res = await request(app).post("/api/auth/resend-otp").send({});
    expect(res.status).toBe(400);
  });

  test("Resend OTP - user not found", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).post("/api/auth/resend-otp").send({
      email: "missing@example.com",
    });
    expect(res.status).toBe(404);
  });

  // --- Request password reset ---
  test("Request password reset - success", async () => {
    const res = await request(app).post("/api/auth/request-password-reset").send({
      email: "user@example.com",
    });
    expect(res.status).toBe(200);
  });

  test("Request password reset - missing email", async () => {
    const res = await request(app).post("/api/auth/request-password-reset").send({});
    expect(res.status).toBe(400);
  });

  test("Request password reset - user not found", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).post("/api/auth/request-password-reset").send({
      email: "missing@example.com",
    });
    expect(res.status).toBe(404);
  });

  // --- Confirm password reset ---
  test("Confirm password reset - success", async () => {
    const res = await request(app).post("/api/auth/confirm-password-reset").send({
      email: "user@example.com",
      otp: "123456",
      newPassword: "newPassword123",
    });
    expect(res.status).toBe(200);
  });

  test("Confirm password reset - missing fields", async () => {
    const res = await request(app).post("/api/auth/confirm-password-reset").send({
      email: "user@example.com",
      otp: "123456",
    });
    expect(res.status).toBe(400);
  });

  test("Confirm password reset - invalid OTP", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValueOnce({
      otp: "654321",
      otpExpires: new Date(Date.now() - 60000),
    });

    const res = await request(app).post("/api/auth/confirm-password-reset").send({
      email: "user@example.com",
      otp: "123456",
      newPassword: "newPassword123",
    });
    expect(res.status).toBe(400);
  });

  test("Confirm Password Reset - error during save returns 500", async () => {
    const mockUser = {
      otp: "123456",
      otpExpires: new Date(Date.now() + 60000),
      save: jest.fn().mockRejectedValue(new Error("DB save error")),
    };
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

    const res = await request(app).post("/api/auth/confirm-password-reset").send({
      email: "user@example.com",
      otp: "123456",
      newPassword: "newPassword123",
    });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Error confirming password reset/);
  });
});
