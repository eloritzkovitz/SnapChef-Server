import mongoose from "mongoose";
import PreferencesSchema, { Preferences } from "./Preferences";

export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string;    
  joinDate?: string;  
  fridgeId: mongoose.Schema.Types.ObjectId;
  cookbookId: mongoose.Schema.Types.ObjectId;
  preferences?: Preferences;
  refreshToken?: string;
}

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  joinDate: { type: String, required: true },
  fridgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fridge' },
  cookbookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cookbook' },
  preferences: { type: PreferencesSchema, default: {} },
  refreshToken: { type: String, default: "" }
});

const userModel = mongoose.model<IUser>("Users", UserSchema);

export default userModel;