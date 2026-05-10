import CardioWorkoutController from "../../controllers/cardioWorkoutController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const CARDIO_WORKOUT_BASE_PATH = "/presets/cardioWorkout";

const cardioWorkoutController = new CardioWorkoutController();

export const cardioWorkoutApiRoutes: ApiRouteHandlers = {
  [`GET ${CARDIO_WORKOUT_BASE_PATH}`]: {
    handler: cardioWorkoutController.getAll,
    access: "public",
  },
  [`GET ${CARDIO_WORKOUT_BASE_PATH}/one`]: {
    handler: cardioWorkoutController.getById,
    access: "trainerOrAdmin",
  },
  [`POST ${CARDIO_WORKOUT_BASE_PATH}`]: {
    handler: cardioWorkoutController.create,
    access: "trainerOrAdmin",
  },
  [`PUT ${CARDIO_WORKOUT_BASE_PATH}/one`]: {
    handler: cardioWorkoutController.updateById,
    access: "trainerOrAdmin",
  },
  [`DELETE ${CARDIO_WORKOUT_BASE_PATH}/one`]: {
    handler: cardioWorkoutController.deleteById,
    access: "trainerOrAdmin",
  },
};
