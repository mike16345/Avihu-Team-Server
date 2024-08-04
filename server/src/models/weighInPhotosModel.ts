import mongoose, { Schema, model } from "mongoose";

const WeighInPhotoSchema = new Schema({
  photo: {
    type: Buffer,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
});

const WeighInPhotoModel = model("WeighInPhoto", WeighInPhotoSchema);

export default WeighInPhotoModel;
