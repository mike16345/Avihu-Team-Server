import DietPlanPresetController from "../../../controllers/dietPlanPresetController";

export const BASE_PATH = "/presets/dietPlans";

export const dietPlanPresetApiHandlers = {
  [`GET ${BASE_PATH}`]: DietPlanPresetController.getDietPlanPresets,
  [`GET ${BASE_PATH}/one`]: DietPlanPresetController.getDietPlanPresetById, // Get diet plan preset by ID
  [`POST ${BASE_PATH}`]: DietPlanPresetController.addDietPlanPreset, // Add new diet plan preset
  [`PUT ${BASE_PATH}/one`]: DietPlanPresetController.updateDietPlanPreset, // Update diet plan preset by ID
  [`DELETE ${BASE_PATH}/one`]: DietPlanPresetController.deleteDietPlanPreset, // Delete diet plan preset by ID
};
