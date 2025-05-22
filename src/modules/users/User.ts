import mongoose from "mongoose";
import PreferencesSchema, { Preferences } from "./Preferences";

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;  
  profilePicture?: string; 
  role?: string;
  fridgeId: mongoose.Schema.Types.ObjectId;
  cookbookId: mongoose.Schema.Types.ObjectId; 
  preferences?: Preferences;
  joinDate?: string;
  refreshToken?: string;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  role: { type: String, default: "user" },
  fridgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fridge' },
  cookbookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cookbook' },
  preferences: { type: PreferencesSchema, default: {}, required: true },
  joinDate: { type: String, required: true },
  refreshToken: { type: String, default: "" }
});

const userModel = mongoose.model<IUser>("Users", UserSchema);

export default userModel;