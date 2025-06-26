import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";
import { validateWorkoutPlanPreset } from "../../middleware/workoutPlanMiddleware";

export const BASE_PATH = "/presets/workoutPlans";

const workoutPlanPresetController=new WorkoutPlanPresetsController()

export const workoutPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]: workoutPlanPresetController.getAll,
  [`GET ${BASE_PATH}/one`]:workoutPlanPresetController.getWorkoutPlanPresetById,//frontend is sending 'presetId' and not id
  [`POST ${BASE_PATH}`]:workoutPlanPresetController.create,
  [`PUT ${BASE_PATH}/one`]:workoutPlanPresetController.updateWorkoutPlanPresetById,//frontend is sending 'presetId' and not id
  [`DELETE ${BASE_PATH}/one`]:workoutPlanPresetController.deleteWorkoutPlanPresetById,//frontend is sending 'presetId' and not id
};

export const workoutPlanPresetApiMiddleware = {
  [`POST ${BASE_PATH}`]: validateWorkoutPlanPreset,
  [`PUT ${BASE_PATH}/one`]: validateWorkoutPlanPreset,
};
