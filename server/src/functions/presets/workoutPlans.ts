import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";
import { validateWorkoutPlanPreset } from "../../middleware/workoutPlanMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const BASE_PATH = "/presets/workoutPlans";

const workoutPlanPresetController = new WorkoutPlanPresetsController();

export const workoutPlanPresetApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: workoutPlanPresetController.getAll,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: workoutPlanPresetController.getWorkoutPlanPresetById,
    access: "subtrainer",
  },
  [`POST ${BASE_PATH}`]: {
    handler: workoutPlanPresetController.addWorkoutPlanPreset,
    access: "subtrainer",
    middlewares: [validateWorkoutPlanPreset],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: workoutPlanPresetController.updateWorkoutPlanPresetById,
    access: "subtrainer",
    middlewares: [validateWorkoutPlanPreset],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: workoutPlanPresetController.deleteWorkoutPlanPresetById,
    access: "subtrainer",
  },
};
