import { ExercisePresetController } from "../../controllers/exercisePresetController";
import { validateExercise } from "../../middleware/exercisePresetMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const EXERCISES_BASE_PATH = "/presets/exercises";

const exercisePresetControllser = new ExercisePresetController();

export const exercisePresetApiRoutes: ApiRouteHandlers = {
  [`GET ${EXERCISES_BASE_PATH}`]: {
    handler: exercisePresetControllser.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${EXERCISES_BASE_PATH}/one`]: {
    handler: exercisePresetControllser.getById,
    access: "trainerOrAdmin",
  },
  [`GET ${EXERCISES_BASE_PATH}/muscleGroup`]: {
    handler: exercisePresetControllser.getAll,
    access: "trainerOrAdmin",
  },
  [`POST ${EXERCISES_BASE_PATH}`]: {
    handler: exercisePresetControllser.create,
    access: "trainerOrAdmin",
    middlewares: [validateExercise],
  },
  [`PUT ${EXERCISES_BASE_PATH}/one`]: {
    handler: exercisePresetControllser.updateById,
    access: "trainerOrAdmin",
    middlewares: [validateExercise],
  },
  [`DELETE ${EXERCISES_BASE_PATH}/one`]: {
    handler: exercisePresetControllser.deleteById,
    access: "trainerOrAdmin",
  },
};
