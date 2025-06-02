import crypto from 'crypto';

/**
 * Generate a random OTP and its expiration time.
 * @returns {object} An object containing the OTP and its expiration time.
 */
export function generateOtp() {
  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes
  return { otp, otpExpires };
}