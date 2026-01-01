import FormPresetController from "../../controllers/FormPresetController";

export const FORM_PRESET_BASE_PATH = "/presets/forms";

const formPresetController = new FormPresetController();

export const cardioWorkoutApiHandlers = {
  [`GET ${FORM_PRESET_BASE_PATH}`]: formPresetController.getAll,
  [`GET ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.getById,
  [`POST ${FORM_PRESET_BASE_PATH}`]: formPresetController.create,
  [`PUT ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.updateById,
  [`DELETE ${FORM_PRESET_BASE_PATH}/one`]: formPresetController.deleteById,
};
