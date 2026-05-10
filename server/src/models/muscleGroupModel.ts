import { model, Schema } from "mongoose";
import { IModel } from "../interfaces/IModel";

export const muscleGroupSchema = new Schema<{ name: string } & IModel>({
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

export const muscleGroupPresets = model(`muscleGroup`, muscleGroupSchema);
