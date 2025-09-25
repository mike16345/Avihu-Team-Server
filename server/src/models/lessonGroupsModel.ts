import joi from "joi";
import { model, ObjectId, Schema, Types } from "mongoose";

export interface ILessonGroup {
  _id?: Types.ObjectId;
  name: string;
}

const LessonSchema = new Schema<ILessonGroup>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const LessonGroup = model("lessonGroups", LessonSchema);

const lessonGroupJoiSchema = joi.object({
  name: joi.string().min(1).max(75),
});

export { LessonGroup, lessonGroupJoiSchema };
