import { model, Schema } from "mongoose";

export const exerciseMethodSchema = new Schema({
    title: {
        type: String,
        required: true,
        minlength: 1
    },
    description: {
        type: String,
        required: true,
        minlength: 1
    },
});

export const exerciseMethods = model(`exerciseMethod`, exerciseMethodSchema);