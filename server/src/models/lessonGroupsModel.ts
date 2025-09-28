import joi from "joi";
import { model, Schema, Types } from "mongoose";

export interface ILessonGroup {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
}

const LessonSchema = new Schema<ILessonGroup>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
});

const LessonGroup = model("lessonGroups", LessonSchema);

const lessonGroupJoiSchema = joi.object({
  name: joi.string().min(1).max(75),
  description: joi.string().optional().max(150).allow(""),
});

export { LessonGroup, lessonGroupJoiSchema };
