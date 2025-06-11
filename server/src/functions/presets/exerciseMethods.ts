import ExerciseMethodController from "../../controllers/exerciseMethodController";

export const EXERCISE_METHODS_BASE_PATH = "/presets/exerciseMethods";

const exerciseMethodController = new ExerciseMethodController();

export const exerciseMethodsApiHandlers = {
  [`GET ${EXERCISE_METHODS_BASE_PATH}`]: exerciseMethodController.getAll.bind(exerciseMethodController),
  [`GET ${EXERCISE_METHODS_BASE_PATH}/one`]: exerciseMethodController.getById.bind(exerciseMethodController),
  [`GET ${EXERCISE_METHODS_BASE_PATH}/name`]: exerciseMethodController.getOne.bind(exerciseMethodController),
  [`POST ${EXERCISE_METHODS_BASE_PATH}`]: exerciseMethodController.create.bind(exerciseMethodController),
  [`PUT ${EXERCISE_METHODS_BASE_PATH}/one`]: exerciseMethodController.updateById.bind(exerciseMethodController),
  [`DELETE ${EXERCISE_METHODS_BASE_PATH}/one`]: exerciseMethodController.deleteById.bind(exerciseMethodController),
};
