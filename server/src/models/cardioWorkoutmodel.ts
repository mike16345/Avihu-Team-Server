import { model, Schema } from "mongoose";

export const cardioWorkout = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
});

export const cardioWorkoutPreset = model(`cardioWorkout`, cardioWorkout);
