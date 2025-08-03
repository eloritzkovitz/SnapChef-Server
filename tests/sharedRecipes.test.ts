import sharedRecipeController from "../src/modules/cookbook/sharedRecipeController";
import SharedRecipe from "../src/modules/cookbook/SharedRecipe";
import { getUserId } from "../src/utils/requestHelpers";
import logger from "../src/utils/logger";

jest.mock("../src/modules/cookbook/SharedRecipe");
jest.mock("../src/utils/requestHelpers");
jest.mock("../src/utils/logger");

describe("sharedRecipeController", () => {
    const mockReq: any = {
        params: {},
        body: {},
        query: {},
        headers: {},
    };
    const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getSharedRecipes", () => {
        it("should return shared recipes", async () => {
            const mockUserId = "user123";
            (getUserId as jest.Mock).mockReturnValue(mockUserId);
            (SharedRecipe.find as jest.Mock).mockImplementation((filter) => {
                if (filter.toUser === mockUserId) return Promise.resolve(["recipe1"]);
                if (filter.fromUser === mockUserId) return Promise.resolve(["recipe2"]);
                return Promise.resolve([]);
            });

            await sharedRecipeController.getSharedRecipes(mockReq, mockRes);

            expect(getUserId).toHaveBeenCalledWith(mockReq);
            expect(SharedRecipe.find).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                sharedWithMe: ["recipe1"],
                sharedByMe: ["recipe2"],
            });
        });

        it("should handle errors", async () => {
            (getUserId as jest.Mock).mockReturnValue("user123");
            (SharedRecipe.find as jest.Mock).mockRejectedValue(new Error("DB Error"));

            await sharedRecipeController.getSharedRecipes(mockReq, mockRes);

            expect(logger.error).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Failed to fetch shared recipes",
            });
        });
    });

    describe("deleteSharedRecipe", () => {
        it("should delete a shared recipe if user is authorized", async () => {
            const mockUserId = "user456";
            const mockRecipeId = "recipe789";
            mockReq.params.sharedRecipeId = mockRecipeId;
            (getUserId as jest.Mock).mockReturnValue(mockUserId);
            (SharedRecipe.findOneAndDelete as jest.Mock).mockResolvedValue({ _id: mockRecipeId });

            await sharedRecipeController.deleteSharedRecipe(mockReq, mockRes);

            expect(SharedRecipe.findOneAndDelete).toHaveBeenCalledWith({
                _id: mockRecipeId,
                $or: [{ toUser: mockUserId }, { fromUser: mockUserId }],
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Shared recipe removed",
            });
        });

        it("should return 404 if recipe not found", async () => {
            const mockUserId = "user456";
            const mockRecipeId = "recipe999";
            mockReq.params.sharedRecipeId = mockRecipeId;
            (getUserId as jest.Mock).mockReturnValue(mockUserId);
            (SharedRecipe.findOneAndDelete as jest.Mock).mockResolvedValue(null);

            await sharedRecipeController.deleteSharedRecipe(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Shared recipe not found or not authorized",
            });
        });

        it("should handle deletion errors", async () => {
            const mockUserId = "user789";
            const mockRecipeId = "recipe500";
            mockReq.params.sharedRecipeId = mockRecipeId;
            (getUserId as jest.Mock).mockReturnValue(mockUserId);
            (SharedRecipe.findOneAndDelete as jest.Mock).mockRejectedValue(new Error("DB Error"));

            await sharedRecipeController.deleteSharedRecipe(mockReq, mockRes);

            expect(logger.error).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Failed to remove shared recipe",
            });
        });
    });
});
