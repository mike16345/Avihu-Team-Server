import { Schema, model } from "mongoose";

export const passwordSchema = new Schema({
  hash: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    ref: "User",
  },
});

export const Password = model("password", passwordSchema);
