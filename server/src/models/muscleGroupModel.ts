import { model, Schema } from "mongoose";

export const muscleGroupSchema = new Schema({
    itemName: String
})

export const muscleGroupPresets = model(`muscleGroupPresets`, muscleGroupSchema)