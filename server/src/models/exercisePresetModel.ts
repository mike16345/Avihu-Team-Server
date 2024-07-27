import Joi, { required } from "joi";
import { model, Schema } from "mongoose";

/**
 * This mongoose schema will allow anything to be added to the database.
 * Type your arguments using this format:
 * {
 *       name:{
 *           type: String,
 *           required:true,
 *       }
 * }
 * }
 */
export const exercisePresetSchema = new Schema({
  name: String,
  linkToVideo: String,
  tipsFromTrainer: String,
  muscleGroup: String,
});

export const exercisePresets = model(`exercisePresets`, exercisePresetSchema);

// Mongoose schema and JOI schema should match each other .
export const exercisePresetValidationSchema = Joi.object({
  name: Joi.string().min(1).required(),
  // The minimum number characters should be larger. Maybe search up ways to validate youtube links. 
  linkToVideo: Joi.string().min(1).required(),
  // Tips from trainer should not be required
  tipsFromTrainer: Joi.string().min(1).required(),
  // Muscle group should be required
  muscleGroup: Joi.string().min(1),
});
