import mongoose, { Schema, Document, Types } from 'mongoose';
import { Ingredient } from '../ingredients/Ingredient';

interface Fridge extends Document {  
  ownerId: Schema.Types.ObjectId,
  ingredients: Ingredient[]; 
}

const FridgeSchema: Schema = new Schema(
  {    
    ownerId: { type: Schema.Types.ObjectId, ref: 'Users', required: true }, 
    ingredients: [{ type: Schema.Types.ObjectId, ref: 'Ingredient' }],
  },
  { timestamps: true }
);

const fridgeModel = mongoose.model<Fridge>("Fridges", FridgeSchema);

export default fridgeModel;
