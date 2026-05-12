import ExerciseMethodController from "../../controllers/exerciseMethodController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const EXERCISE_METHODS_BASE_PATH = "/presets/exerciseMethods";

const exerciseMethodController = new ExerciseMethodController();

export const exerciseMethodsApiRoutes: ApiRouteHandlers = {
  [`GET ${EXERCISE_METHODS_BASE_PATH}`]: {
    handler: exerciseMethodController.getAll,
    access: "subtrainer",
  },
  [`GET ${EXERCISE_METHODS_BASE_PATH}/one`]: {
    handler: exerciseMethodController.getById,
    access: "subtrainer",
  },
  [`GET ${EXERCISE_METHODS_BASE_PATH}/name`]: {
    handler: exerciseMethodController.getOne,
    access: "authenticated",
  },
  [`POST ${EXERCISE_METHODS_BASE_PATH}`]: {
    handler: exerciseMethodController.create,
    access: "subtrainer",
  },
  [`PUT ${EXERCISE_METHODS_BASE_PATH}/one`]: {
    handler: exerciseMethodController.updateById,
    access: "subtrainer",
  },
  [`DELETE ${EXERCISE_METHODS_BASE_PATH}/one`]: {
    handler: exerciseMethodController.deleteById,
    access: "subtrainer",
  },
};
