import FormPresetController from "../../controllers/FormPresetController";
import { validateFormPreset } from "../../middleware/formPresetMiddleware";

export const FORM_PRESET_BASE_PATH = "/presets/forms";

const formPresetController = new FormPresetController();

export const formPresetApiHandlers = {
  [`GET ${FORM_PRESET_BASE_PATH}`]: formPresetController.getAll,
  [`GET ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.getById,
  [`POST ${FORM_PRESET_BASE_PATH}`]: formPresetController.create,
  [`PUT ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.updateById,
  [`DELETE ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.deleteById,
};

export const formPresetsMiddleware = {
  [`POST ${FORM_PRESET_BASE_PATH}`]: validateFormPreset,
  [`PUT ${FORM_PRESET_BASE_PATH}/one`]: validateFormPreset,
};
