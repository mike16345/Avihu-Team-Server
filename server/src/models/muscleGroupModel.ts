import { model, Schema } from "mongoose";

export const muscleGroupSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 1
    },
});

export const muscleGroupPresets = model(`muscleGroup`, muscleGroupSchema);
