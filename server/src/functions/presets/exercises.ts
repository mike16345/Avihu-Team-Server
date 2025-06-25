import { ExercisePresetController } from "../../controllers/exercisePresetController";
import { validateExercise } from "../../middleware/exercisePresetMiddleware";
`../../controllers/exercisePresetController`;
export const EXERCISES_BASE_PATH = "/presets/exercises";

const exercisePresetControllser=new ExercisePresetController()

export const exercisePresetApiHandlers = {
  [`GET ${EXERCISES_BASE_PATH}`]: exercisePresetControllser.getAll,
  [`GET ${EXERCISES_BASE_PATH}/one`]: exercisePresetControllser.getById,
  [`GET ${EXERCISES_BASE_PATH}/muscleGroup`]: ExercisePresetController.getExercisesByMuscleGroup,
  [`POST ${EXERCISES_BASE_PATH}`]: exercisePresetControllser.create,
  [`PUT ${EXERCISES_BASE_PATH}/one`]: exercisePresetControllser.updateById,
  [`DELETE ${EXERCISES_BASE_PATH}/one`]: exercisePresetControllser.deleteById,
};

export const exerciseMiddlewareHandlers = {
  [`POST ${EXERCISES_BASE_PATH}`]: validateExercise,
  [`PUT ${EXERCISES_BASE_PATH}/one`]: validateExercise,
};
