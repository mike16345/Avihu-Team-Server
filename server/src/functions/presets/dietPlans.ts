import { DietPlanPresetController } from "../../controllers/dietPlanPresetController";
import { validateDietPlanPreset } from "../../middleware/dietPlanMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const BASE_PATH = "/presets/dietPlans";

const dietPlanPresetController = new DietPlanPresetController();

export const dietPlanPresetApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: dietPlanPresetController.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: dietPlanPresetController.getById,
    access: "trainerOrAdmin",
  },
  [`POST ${BASE_PATH}`]: {
    handler: dietPlanPresetController.create,
    access: "trainerOrAdmin",
    middlewares: [validateDietPlanPreset],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: dietPlanPresetController.updateDietPlanPreset,
    access: "trainerOrAdmin",
    middlewares: [validateDietPlanPreset],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: dietPlanPresetController.deleteById,
    access: "trainerOrAdmin",
  },
};
