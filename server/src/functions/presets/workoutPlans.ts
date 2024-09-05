import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";

export const BASE_PATH = "/presets/workoutPlans";

export const workoutPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]: WorkoutPlanPresetsController.getAllWorkoutPlanPresets,
  [`GET ${BASE_PATH}/one`]: WorkoutPlanPresetsController.getWorkoutPlanPresetById, // Get diet plan preset by ID
  [`POST ${BASE_PATH}`]: WorkoutPlanPresetsController.addWorkoutPlanPreset, // Add new diet plan preset
  [`PUT ${BASE_PATH}/one`]: WorkoutPlanPresetsController.updateWorkoutPlanPreset, // Update diet plan preset by ID
  [`DELETE ${BASE_PATH}/one`]: WorkoutPlanPresetsController.deleteWorkoutPlanPreset, // Delete diet plan preset by ID
};
