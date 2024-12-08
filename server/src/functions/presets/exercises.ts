import { ExercisePresetController } from "../../controllers/exercisePresetController";
import { validateExercise } from "../../middleware/exercisePresetMiddleware";
`../../controllers/exercisePresetController`;
export const EXERCISES_BASE_PATH = "/presets/exercises";

export const exercisePresetApiHandlers = {
  [`GET ${EXERCISES_BASE_PATH}`]: ExercisePresetController.getExercises,
  [`GET ${EXERCISES_BASE_PATH}/one`]: ExercisePresetController.getExerciseById,
  [`GET ${EXERCISES_BASE_PATH}/muscleGroup`]: ExercisePresetController.getExercisesByMuscleGroup,
  [`POST ${EXERCISES_BASE_PATH}`]: ExercisePresetController.addExercise,
  [`PUT ${EXERCISES_BASE_PATH}/one`]: ExercisePresetController.updateExercise,
  [`DELETE ${EXERCISES_BASE_PATH}/one`]: ExercisePresetController.deleteExercise,
};

export const exerciseMiddlewareHandlers = {
  [`POST ${EXERCISES_BASE_PATH}`]: validateExercise,
  [`PUT ${EXERCISES_BASE_PATH}/one`]: validateExercise,
};
