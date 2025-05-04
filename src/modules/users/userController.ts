import { Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import userModel from './User';
import fridgeModel from '../fridge/Fridge';
import cookbookModel from '../cookbook/Cookbook';
import { deleteFile } from '../../utils/fileService';
import { generateToken, verifyRefreshToken } from '../../utils/tokenService';
import { logActivity } from '../../utils/logService';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleSignIn = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) return res.status(400).send('Invalid Google ID token');

        const { sub, email, given_name, family_name, picture } = payload;
        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                firstName: given_name,
                lastName: family_name,
                email,
                password: sub,
                profilePicture: picture,
                joinDate: new Date().toISOString()
            });
        }

        const tokens = generateToken(user._id);
        if (!tokens) return res.status(500).send('Token generation failed');

        user.refreshToken?.push(tokens.refreshToken);
        await user.save();

        await logActivity(user._id.toString(), 'login', 'user', user._id.toString(), { source: 'google' });

        res.status(200).send({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, _id: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
};

const register = async (req: Request, res: Response) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await userModel.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
            profilePicture: "",
            joinDate: new Date().toISOString()
        });

        const fridge = await fridgeModel.create({ ownerId: user._id, ingredients: [] });
        const cookbook = await cookbookModel.create({ ownerId: user._id, recipes: [] });

        user.fridgeId = fridge._id as any;
        user.cookbookId = cookbook._id as any;
        await user.save();

        res.status(200).send(user);
    } catch (err) {
        res.status(400).send(err);
    }
};

const login = async (req: Request, res: Response) => {
    try {
        const user = await userModel.findOne({ email: req.body.email });
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).send('Wrong username or password');
        }

        const tokens = generateToken(user._id);
        if (!tokens) return res.status(500).send('Token generation failed');

        user.refreshToken?.push(tokens.refreshToken);
        await user.save();

        await logActivity(user._id.toString(), 'login', 'user', user._id.toString(), {});

        res.status(200).send({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, _id: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
};

const getUserData = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id || req.params.userId;
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
          }
        await logActivity(userId, 'read', 'user', userId, {});

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data', error });
    }
};

const findUsersByName = async (req: Request, res: Response): Promise<void> => {
    const query = req.query.query as string;
    if (!query) {
        res.status(400).json({ error: "Query parameter is required" });
        return;
      }
      
    try {
        const users = await userModel.find({
            $or: [
                { firstName: { $regex: query, $options: "i" } },
                { lastName: { $regex: query, $options: "i" } },
            ]
        }).select("_id firstName lastName profilePicture");

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
};

const updateUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
          }
          
        Object.assign(user, req.body);
        if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);

        if (req.file || req.body.profilePicture === "") {
            if (user.profilePicture && user.profilePicture !== "") {
                deleteFile(path.resolve(__dirname, '../../uploads', path.basename(user.profilePicture)));
            }
            user.profilePicture = req.file ? `/uploads/${req.file.filename}` : "";
        }

        await user.save();

        await logActivity(user._id.toString(), 'update', 'user', user._id.toString(), req.body);

        res.json({ ...user.toObject() });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user data', error });
    }
};

const deleteUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
          }

        if (user.profilePicture && user.profilePicture !== "") {
            deleteFile(path.resolve(__dirname, '../../uploads', path.basename(user.profilePicture)));
        }

        await fridgeModel.findByIdAndDelete(user.fridgeId);
        await cookbookModel.findByIdAndDelete(user.cookbookId);
        await userModel.findByIdAndDelete(userId);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token is required" });

    try {
        const user = await verifyRefreshToken(refreshToken);
        await user.save();
        res.status(200).send("success");
    } catch (err) {
        res.status(400).send("fail");
    }
};

const refresh = async (req: Request, res: Response) => {
    try {
        const user = await verifyRefreshToken(req.body.refreshToken);
        if (!user) return res.status(400).send("fail");

        const tokens = generateToken(user._id);
        if (!tokens) return res.status(500).send("Token generation failed");

        user.refreshToken?.push(tokens.refreshToken);
        await user.save();

        res.status(200).send({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            _id: user._id
        });
    } catch (err) {
        res.status(400).send(err);
    }
};

export default {
    register,
    googleSignIn,
    login,
    getUserData,
    findUsersByName,
    updateUser,
    deleteUser,
    refresh,
    logout
};
