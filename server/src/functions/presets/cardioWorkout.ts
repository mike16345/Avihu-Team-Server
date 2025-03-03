import CardioWorkoutController from "../../controllers/cardioWorkoutController";

export const CARDIO_WORKOUT_BASE_PATH = "/presets/cardioWorkout";

export const cardioWorkoutApiHandlers = {
  [`GET ${CARDIO_WORKOUT_BASE_PATH}`]: CardioWorkoutController.getAllCardioWorkout,
  [`GET ${CARDIO_WORKOUT_BASE_PATH}/one`]: CardioWorkoutController.getCardioWorkoutById,
  [`POST ${CARDIO_WORKOUT_BASE_PATH}`]: CardioWorkoutController.addCardioWorkout,
  [`PUT ${CARDIO_WORKOUT_BASE_PATH}/one`]: CardioWorkoutController.editCardioWorkout,
  [`DELETE ${CARDIO_WORKOUT_BASE_PATH}/one`]: CardioWorkoutController.deleteCardioWorkout,
};
