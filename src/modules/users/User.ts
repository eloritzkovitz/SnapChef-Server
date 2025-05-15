import mongoose from "mongoose";

export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string;    
  joinDate?: string;  
  refreshToken?: string;
  fridgeId: mongoose.Schema.Types.ObjectId;
  cookbookId: mongoose.Schema.Types.ObjectId;
}

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  joinDate: { type: String, required: true },
  fridgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fridge' },
  cookbookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cookbook' },
  refreshToken: { type: String, default: "" }
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;