import Joi from "joi";
import { model, Schema } from "mongoose";
import { IBlog } from "../interfaces/IBlog";

export interface IUserImageUrls {
  userId: string;
  imageUrls: string[];
}

export const blogSchema = new Schema<IBlog>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  link: {
    type: String,
  },
  group: {
    type: String,
    default: "general",
  },
});

export const BlogModel = model("blogs", blogSchema);

export const blogPostSchemaValidator = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  imageUrl: Joi.string().allow(""),
  date: Joi.date(),
  group: Joi.string().optional(),
  link: Joi.string().optional(),
});
