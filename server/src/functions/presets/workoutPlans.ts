import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";
import { validateWorkoutPlanPreset } from "../../middleware/workoutPlanMiddleware";

export const BASE_PATH = "/presets/workoutPlans";

const workoutPlanPresetController = new WorkoutPlanPresetsController();

export const workoutPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]: workoutPlanPresetController.getAll,
  [`GET ${BASE_PATH}/one`]: workoutPlanPresetController.getWorkoutPlanPresetById,
  [`POST ${BASE_PATH}`]: workoutPlanPresetController.addWorkoutPlanPreset,
  [`PUT ${BASE_PATH}/one`]: workoutPlanPresetController.updateWorkoutPlanPresetById,
  [`DELETE ${BASE_PATH}/one`]: workoutPlanPresetController.deleteWorkoutPlanPresetById,
};

export const workoutPlanPresetApiMiddleware = {
  [`POST ${BASE_PATH}`]: validateWorkoutPlanPreset,
  [`PUT ${BASE_PATH}/one`]: validateWorkoutPlanPreset,
};
