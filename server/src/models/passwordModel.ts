import { Schema, model } from "mongoose";

export interface IPassword {
  hash: string;
  userId: string;
}

export const passwordSchema = new Schema<IPassword>({
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
