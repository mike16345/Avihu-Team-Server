import FormPresetController from "../../controllers/FormPresetController";
import FormResponseController from "../../controllers/FormResponseController";
import { validateFormPreset } from "../../middleware/formPresetMiddleware";
import { validateFormResponse } from "../../middleware/formResponseMiddleware";

export const FORM_PRESET_BASE_PATH = "/presets/forms";
export const FORM_RESPONSE_BASE_PATH = `${FORM_PRESET_BASE_PATH}/responses`;

const formPresetController = new FormPresetController();
const formResponseController = new FormResponseController();

export const formPresetApiHandlers = {
  [`GET ${FORM_PRESET_BASE_PATH}`]: formPresetController.getAll,
  [`GET ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.getById,
  [`POST ${FORM_PRESET_BASE_PATH}`]: formPresetController.create,
  [`PUT ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.updateById,
  [`DELETE ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.deleteById,
  [`GET ${FORM_RESPONSE_BASE_PATH}`]: formResponseController.getAll,
  [`GET ${FORM_RESPONSE_BASE_PATH}/one`]: formResponseController.getById,
  [`POST ${FORM_RESPONSE_BASE_PATH}`]: formResponseController.create,
  [`PUT ${FORM_RESPONSE_BASE_PATH}/one`]: formResponseController.updateById,
  [`DELETE ${FORM_RESPONSE_BASE_PATH}/one`]: formResponseController.deleteById,
};

export const formPresetsMiddleware = {
  [`POST ${FORM_PRESET_BASE_PATH}`]: validateFormPreset,
  [`PUT ${FORM_PRESET_BASE_PATH}/one`]: validateFormPreset,
  [`POST ${FORM_RESPONSE_BASE_PATH}`]: validateFormResponse,
  [`PUT ${FORM_RESPONSE_BASE_PATH}/one`]: validateFormResponse,
};
