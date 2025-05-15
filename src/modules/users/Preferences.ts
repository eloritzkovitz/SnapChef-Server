import mongoose from "mongoose";

export interface Preferences {
  allergies: string[];
  dietaryPreferences: {
    vegan: boolean;
    vegetarian: boolean;
    pescatarian: boolean;
    carnivore: boolean;
    ketogenic: boolean;
    paleo: boolean;
    lowCarb: boolean;
    lowFat: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    kosher: boolean;
    halal: boolean;
  };
}

const PreferencesSchema = new mongoose.Schema<Preferences>({
  allergies: { type: [String], default: [] },
  dietaryPreferences: {
    vegan: { type: Boolean, default: false },
    vegetarian: { type: Boolean, default: false },
    pescatarian: { type: Boolean, default: false },
    carnivore: { type: Boolean, default: false },
    ketogenic: { type: Boolean, default: false },
    paleo: { type: Boolean, default: false },
    lowCarb: { type: Boolean, default: false },
    lowFat: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
  },
});

export default PreferencesSchema;