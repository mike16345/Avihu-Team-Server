import { model, Schema } from "mongoose";
import { IModel } from "../interfaces/IModel";

interface IExerciseMethod extends IModel {
  title: string;
  description: string;
}

export const exerciseMethodSchema = new Schema<IExerciseMethod>({
  title: {
    type: String,
    required: true,
    minlength: 1,
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
  },
  description: {
    type: String,
    required: true,
    minlength: 1,
  },
});

export const exerciseMethods = model<IExerciseMethod>(`exerciseMethod`, exerciseMethodSchema);
