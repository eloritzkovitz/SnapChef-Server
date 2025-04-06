import mongoose, { Schema, Document } from 'mongoose';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  imageURL?: string;
  quantity: number;
}

interface Fridge extends Document {  
  ownerId: Schema.Types.ObjectId,
  ingredients: Ingredient[]; 
}

const FridgeSchema: Schema = new Schema(
  {    
    ownerId: { type: Schema.Types.ObjectId, ref: 'Users', required: true }, 
    ingredients: { type: [Object], default: [] },
  },
  { timestamps: true }
);

const fridgeModel = mongoose.model<Fridge>("Fridges", FridgeSchema);

export default fridgeModel;
