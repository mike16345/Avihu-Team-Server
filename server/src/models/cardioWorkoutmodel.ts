import { model, Schema } from "mongoose";
import { ICardioWorkout } from "../interfaces/IWorkoutPlan";
import { IModel } from "../interfaces/IModel";

export const cardioWorkout = new Schema<ICardioWorkout & IModel>({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
  },
});

export const cardioWorkoutPreset = model(`cardioWorkout`, cardioWorkout);
