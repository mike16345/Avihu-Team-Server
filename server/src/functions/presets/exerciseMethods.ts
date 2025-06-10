import ExerciseMethodController from "../../controllers/exerciseMethodController";

export const EXERCISE_METHODS_BASE_PATH = "/presets/exerciseMethods";

const exerciseMethodController = new ExerciseMethodController();

export const exerciseMethodsApiHandlers = {
  [`GET ${EXERCISE_METHODS_BASE_PATH}`]: exerciseMethodController,
  [`GET ${EXERCISE_METHODS_BASE_PATH}/one`]: exerciseMethodController.getById,
  [`GET ${EXERCISE_METHODS_BASE_PATH}/name`]: exerciseMethodController.getOne,
  [`POST ${EXERCISE_METHODS_BASE_PATH}`]: exerciseMethodController.create,
  [`PUT ${EXERCISE_METHODS_BASE_PATH}/one`]: exerciseMethodController.updateById,
  [`DELETE ${EXERCISE_METHODS_BASE_PATH}/one`]: exerciseMethodController.deleteById,
};
