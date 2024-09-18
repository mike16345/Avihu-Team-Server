import DietPlanPresetController from "../../controllers/dietPlanPresetController";
import { validateDietPlanPreset } from "../../middleware/dietPlanMiddleware";

export const BASE_PATH = "/presets/dietPlans";

export const dietPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]: DietPlanPresetController.getDietPlanPresets,
  [`GET ${BASE_PATH}/one`]: DietPlanPresetController.getDietPlanPresetById, // Get diet plan preset by ID
  [`POST ${BASE_PATH}`]: DietPlanPresetController.addDietPlanPreset, // Add new diet plan preset
  [`PUT ${BASE_PATH}/one`]: DietPlanPresetController.updateDietPlanPreset, // Update diet plan preset by ID
  [`DELETE ${BASE_PATH}/one`]: DietPlanPresetController.deleteDietPlanPreset, // Delete diet plan preset by ID
};

export const dietPlanPresetsMiddleware = {
  [`POST ${BASE_PATH}`]: validateDietPlanPreset,
  [`PUT ${BASE_PATH}/one`]: validateDietPlanPreset,
};
