import mongoose, { Schema, Document, Types } from 'mongoose';
import { Ingredient } from '../ingredients/Ingredient';

interface Fridge extends Document {  
  ownerId: string;
  ingredients: Ingredient[]; 
}

const FridgeSchema: Schema = new Schema(
  {    
    ownerId: { type: String, required: true }, 
    ingredients: [{ type: Schema.Types.ObjectId, ref: 'Ingredient' }],
  },
  { timestamps: true }
);

const fridgeModel = mongoose.model<Fridge>("Ingredient", FridgeSchema);

export default fridgeModel;
