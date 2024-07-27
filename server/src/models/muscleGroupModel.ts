import { model, Schema } from "mongoose";

// Make name required with minimum characters.
export const muscleGroupSchema = new Schema({
    name: String,
});

export const muscleGroupPresets = model(`muscleGroup`, muscleGroupSchema);
