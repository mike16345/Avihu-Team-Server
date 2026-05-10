import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";
import { validateWorkoutPlanPreset } from "../../middleware/workoutPlanMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const BASE_PATH = "/presets/workoutPlans";

const workoutPlanPresetController = new WorkoutPlanPresetsController();

export const workoutPlanPresetApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: workoutPlanPresetController.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: workoutPlanPresetController.getWorkoutPlanPresetById,
    access: "trainerOrAdmin",
  },
  [`POST ${BASE_PATH}`]: {
    handler: workoutPlanPresetController.addWorkoutPlanPreset,
    access: "trainerOrAdmin",
    middlewares: [validateWorkoutPlanPreset],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: workoutPlanPresetController.updateWorkoutPlanPresetById,
    access: "trainerOrAdmin",
    middlewares: [validateWorkoutPlanPreset],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: workoutPlanPresetController.deleteWorkoutPlanPresetById,
    access: "trainerOrAdmin",
  },
};
