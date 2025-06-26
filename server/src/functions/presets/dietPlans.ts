import {DietPlanPresetController} from "../../controllers/dietPlanPresetController";
import { validateDietPlanPreset } from "../../middleware/dietPlanMiddleware";

export const BASE_PATH = "/presets/dietPlans";

const dietPlanPresetController= new DietPlanPresetController();

export const dietPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]:dietPlanPresetController.getAll,
  [`GET ${BASE_PATH}/one`]:dietPlanPresetController.getById, // Get diet plan preset by ID
  [`POST ${BASE_PATH}`]:dietPlanPresetController.create, // Add new diet plan preset
  [`PUT ${BASE_PATH}/one`]:dietPlanPresetController.updateDietPlanPreset, // Update diet plan preset by ID
  [`DELETE ${BASE_PATH}/one`]:dietPlanPresetController.deleteById, // Delete diet plan preset by ID
};

export const dietPlanPresetsMiddleware = {
  [`POST ${BASE_PATH}`]: validateDietPlanPreset,
  [`PUT ${BASE_PATH}/one`]: validateDietPlanPreset,
};
