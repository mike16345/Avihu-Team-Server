import ExerciseMethodController from "../../controllers/exerciseMethodController";

export const EXERCISE_METHODS_BASE_PATH = "/presets/exerciseMethods";

export const exerciseMethodsApiHandlers = {
  [`GET ${EXERCISE_METHODS_BASE_PATH}`]: ExerciseMethodController.getAllExerciseMethods,
  [`GET ${EXERCISE_METHODS_BASE_PATH}/one`]: ExerciseMethodController.getExerciseMethodById,
  [`GET ${EXERCISE_METHODS_BASE_PATH}/name`]: ExerciseMethodController.getExerciseMethodByName,
  [`POST ${EXERCISE_METHODS_BASE_PATH}`]: ExerciseMethodController.addExerciseMethod,
  [`POST ${EXERCISE_METHODS_BASE_PATH}/many`]: ExerciseMethodController.addManyExerciseMethod,
  [`PUT ${EXERCISE_METHODS_BASE_PATH}/one`]: ExerciseMethodController.editExerciseMethod,
  [`DELETE ${EXERCISE_METHODS_BASE_PATH}/one`]: ExerciseMethodController.deleteExerciseMethod,
};


