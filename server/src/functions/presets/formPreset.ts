import FormPresetController from "../../controllers/FormPresetController";
import FormResponseController from "../../controllers/FormResponseController";
import { validateFormPreset } from "../../middleware/formPresetMiddleware";
import { validateFormResponse } from "../../middleware/formResponseMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

export const FORM_PRESET_BASE_PATH = "/presets/forms";
export const FORM_RESPONSE_BASE_PATH = `${FORM_PRESET_BASE_PATH}/responses`;

const formPresetController = new FormPresetController();
const formResponseController = new FormResponseController();

export const formPresetApiRoutes: ApiRouteHandlers = {
  [`GET ${FORM_PRESET_BASE_PATH}`]: {
    handler: formPresetController.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${FORM_PRESET_BASE_PATH}/one`]: {
    handler: formPresetController.getById,
    access: "public",
  },
  [`GET ${FORM_PRESET_BASE_PATH}/form/one`]: {
    handler: formPresetController.getOne,
    access: "public",
  },
  [`POST ${FORM_PRESET_BASE_PATH}`]: {
    handler: formPresetController.create,
    access: "trainerOrAdmin",
    middlewares: [validateFormPreset],
  },
  [`PUT ${FORM_PRESET_BASE_PATH}/one`]: {
    handler: formPresetController.updateById,
    access: "trainerOrAdmin",
    middlewares: [validateFormPreset],
  },
  [`DELETE ${FORM_PRESET_BASE_PATH}/one`]: {
    handler: formPresetController.deleteById,
    access: "trainerOrAdmin",
  },

  [`GET ${FORM_RESPONSE_BASE_PATH}`]: {
    handler: formResponseController.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${FORM_RESPONSE_BASE_PATH}/one`]: {
    handler: formResponseController.getById,
    access: "trainerOrAdmin",
  },
  [`GET ${FORM_RESPONSE_BASE_PATH}/response/one`]: {
    handler: formResponseController.getOne,
    access: "trainerOrAdmin",
  },
  [`POST ${FORM_RESPONSE_BASE_PATH}`]: {
    handler: formResponseController.create,
    access: "public",
    middlewares: [validateFormResponse],
  },
  [`PUT ${FORM_RESPONSE_BASE_PATH}/one`]: {
    handler: formResponseController.updateById,
    access: "trainerOrAdmin",
    middlewares: [validateFormResponse],
  },
  [`PUT ${FORM_RESPONSE_BASE_PATH}/one/check-off`]: {
    handler: formResponseController.checkOffResponse,
    access: "trainerOrAdmin",
  },
  [`DELETE ${FORM_RESPONSE_BASE_PATH}/one`]: {
    handler: formResponseController.deleteById,
    access: "trainerOrAdmin",
  },
};
