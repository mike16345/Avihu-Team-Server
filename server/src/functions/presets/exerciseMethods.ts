import ExerciseMethodController from "../../controllers/exerciseMethodController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const EXERCISE_METHODS_BASE_PATH = "/presets/exerciseMethods";

const exerciseMethodController = new ExerciseMethodController();

export const exerciseMethodsApiRoutes: ApiRouteHandlers = {
  [`GET ${EXERCISE_METHODS_BASE_PATH}`]: {
    handler: exerciseMethodController.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${EXERCISE_METHODS_BASE_PATH}/one`]: {
    handler: exerciseMethodController.getById,
    access: "trainerOrAdmin",
  },
  [`GET ${EXERCISE_METHODS_BASE_PATH}/name`]: {
    handler: exerciseMethodController.getOne,
    access: "public",
  },
  [`POST ${EXERCISE_METHODS_BASE_PATH}`]: {
    handler: exerciseMethodController.create,
    access: "trainerOrAdmin",
  },
  [`PUT ${EXERCISE_METHODS_BASE_PATH}/one`]: {
    handler: exerciseMethodController.updateById,
    access: "trainerOrAdmin",
  },
  [`DELETE ${EXERCISE_METHODS_BASE_PATH}/one`]: {
    handler: exerciseMethodController.deleteById,
    access: "trainerOrAdmin",
  },
};
