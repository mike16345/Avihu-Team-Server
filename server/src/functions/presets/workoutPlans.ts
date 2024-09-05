import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";
import { validateWorkoutPlanPreset } from "../../middleware/workoutPlanMiddleware";

export const BASE_PATH = "/presets/workoutPlans";

export const workoutPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]: WorkoutPlanPresetsController.getAllWorkoutPlanPresets,
  [`GET ${BASE_PATH}/one`]: WorkoutPlanPresetsController.getWorkoutPlanPresetById,
  [`POST ${BASE_PATH}`]: WorkoutPlanPresetsController.addWorkoutPlanPreset,
  [`PUT ${BASE_PATH}/one`]: WorkoutPlanPresetsController.updateWorkoutPlanPreset,
  [`DELETE ${BASE_PATH}/one`]: WorkoutPlanPresetsController.deleteWorkoutPlanPreset,
};

export const workoutPlanPresetApiMiddleware = {
  [`POST ${BASE_PATH}`]: validateWorkoutPlanPreset,
  [`PUT ${BASE_PATH}/one`]: validateWorkoutPlanPreset,
};
