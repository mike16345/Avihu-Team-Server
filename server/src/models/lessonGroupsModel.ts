import joi from "joi";
import { model, Schema } from "mongoose";

interface ILessonGroup {
  group: string;
}

const LessonSchema = new Schema<ILessonGroup>({
  group: {
    type: String,
    required: true,
    unique: true,
  },
});

const LessonGroup = model("lessonGroups", LessonSchema);

const lessonGroupJoiSchema = joi.object({
  group: joi.string().min(1).max(75),
});

export { LessonGroup, lessonGroupJoiSchema };
