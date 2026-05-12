import CardioWorkoutController from "../../controllers/cardioWorkoutController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const CARDIO_WORKOUT_BASE_PATH = "/presets/cardioWorkout";

const cardioWorkoutController = new CardioWorkoutController();

export const cardioWorkoutApiRoutes: ApiRouteHandlers = {
  [`GET ${CARDIO_WORKOUT_BASE_PATH}`]: {
    handler: cardioWorkoutController.getAll,
    access: "authenticated",
  },
  [`GET ${CARDIO_WORKOUT_BASE_PATH}/one`]: {
    handler: cardioWorkoutController.getById,
    access: "authenticated",
  },
  [`POST ${CARDIO_WORKOUT_BASE_PATH}`]: {
    handler: cardioWorkoutController.create,
    access: "subtrainer",
  },
  [`PUT ${CARDIO_WORKOUT_BASE_PATH}/one`]: {
    handler: cardioWorkoutController.updateById,
    access: "subtrainer",
  },
  [`DELETE ${CARDIO_WORKOUT_BASE_PATH}/one`]: {
    handler: cardioWorkoutController.deleteById,
    access: "subtrainer",
  },
};
