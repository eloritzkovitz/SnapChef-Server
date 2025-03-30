import userModel, { IUser } from '../modules/users/User';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';

type tTokens = {
    accessToken: string,
    refreshToken: string
}

// Generate token
export const generateToken = (userId: string): tTokens | null => {
    if (!process.env.TOKEN_SECRET) {
        return null;
    }
    // generate token
    const random = Math.random().toString();
    const accessToken = jwt.sign({
        _id: userId,
        random: random
    },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRES });

    const refreshToken = jwt.sign({
        _id: userId,
        random: random
    },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });    

    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    };
};

type tUser = Document<unknown, {}, IUser> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}

// Verify refresh token
export const verifyRefreshToken = (refreshToken: string | undefined) => {
    return new Promise<tUser>((resolve, reject) => {
        if (!refreshToken) {
            reject("Refresh token is required");
            return;
        }
        if (!process.env.TOKEN_SECRET) {
            reject("Token secret is missing");
            return;
        }
        jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, payload: any) => {
            if (err) {
                reject("fail");
                return;
            }
            const userId = payload._id;
            try {
                const user = await userModel.findById(userId);
                if (!user) {
                    reject("fail");
                    return;
                }
                if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
                    user.refreshToken = [];
                    await user.save();
                    reject("fail");
                    return;
                }
                const tokens = user.refreshToken!.filter((token) => token !== refreshToken);
                user.refreshToken = tokens;

                resolve(user);
            } catch (err) {
                reject("fail");
                return;
            }
        });
    });
};