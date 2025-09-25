import Joi from "joi";
import { model, Schema } from "mongoose";
import { IBlog } from "../interfaces/IBlog";

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
  planType: {
    type: String,
    default: "כללי",
  },
  group: {
    type: String,
  },
  views: {
    type: [String],
    default: [],
  },
  likes: {
    type: [String],
    default: [],
  },
});

export const BlogModel = model("blogs", blogSchema);

export const blogPostSchemaValidator = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  imageUrl: Joi.string().allow(""),
  date: Joi.date(),
  group: Joi.string(),
  planType: Joi.string().optional(),
  link: Joi.string().optional(),
  views: Joi.array().allow([]),
  likes: Joi.array().allow([]),
});
