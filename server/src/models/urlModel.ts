import Joi from "joi";
import { model, Schema } from "mongoose";

export interface IUserImageUrls {
  userId: string;
  imageUrls: string[];
}

export const userImageUrlsSchema = new Schema<IUserImageUrls>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrls: {
    type: [String],
    required: true,
    default: [],
  },
});

export const UserImageUrlsModel = model("userImageUrls", userImageUrlsSchema);

export const userImageSchemaValidator = Joi.object({
  userId: Joi.string().required(),
  imageUrl: Joi.string().min(1).required(),
});

export const userImageReplaceSchemaValidator = Joi.object({
  userId: Joi.string().required(),
  oldImageUrl: Joi.string().min(1).required(),
  newImageUrl: Joi.string().min(1).required(),
});
