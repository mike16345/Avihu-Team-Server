import CardioWorkoutController from "../../controllers/cardioWorkoutController";

export const CARDIO_WORKOUT_BASE_PATH = "/presets/cardioWorkout";

const cardioWorkoutController=new CardioWorkoutController()

export const cardioWorkoutApiHandlers = {
  [`GET ${CARDIO_WORKOUT_BASE_PATH}`]: cardioWorkoutController.getAll,
  [`GET ${CARDIO_WORKOUT_BASE_PATH}/one`]: cardioWorkoutController.getById,
  [`POST ${CARDIO_WORKOUT_BASE_PATH}`]: cardioWorkoutController.create,
  [`PUT ${CARDIO_WORKOUT_BASE_PATH}/one`]: cardioWorkoutController.updateById,
  [`DELETE ${CARDIO_WORKOUT_BASE_PATH}/one`]: cardioWorkoutController.deleteById,
};
cardioWorkoutController