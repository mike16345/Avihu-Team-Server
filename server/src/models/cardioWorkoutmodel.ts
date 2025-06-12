import { model, Schema } from "mongoose";
import { ICardioWorkout } from "../interfaces/IWorkoutPlan";

export const cardioWorkout = new Schema<ICardioWorkout>({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
});

export const cardioWorkoutPreset = model(`cardioWorkout`, cardioWorkout);
