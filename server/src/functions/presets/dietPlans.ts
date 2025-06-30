import {DietPlanPresetController} from "../../controllers/dietPlanPresetController";
import { validateDietPlanPreset } from "../../middleware/dietPlanMiddleware";

export const BASE_PATH = "/presets/dietPlans";

const dietPlanPresetController= new DietPlanPresetController();

export const dietPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]:dietPlanPresetController.getAll,
  [`GET ${BASE_PATH}/one`]:dietPlanPresetController.getById, 
  [`POST ${BASE_PATH}`]:dietPlanPresetController.create, 
  [`PUT ${BASE_PATH}/one`]:dietPlanPresetController.updateDietPlanPreset, 
  [`DELETE ${BASE_PATH}/one`]:dietPlanPresetController.deleteById, 
};

export const dietPlanPresetsMiddleware = {
  [`POST ${BASE_PATH}`]: validateDietPlanPreset,
  [`PUT ${BASE_PATH}/one`]: validateDietPlanPreset,
};
