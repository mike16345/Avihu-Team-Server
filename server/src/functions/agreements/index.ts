import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AgreementController } from "../../controllers/AgreementController";
import { validateAgreementSign } from "../../middleware/agreementsMiddleware";

import { AgreementAdminController } from "../../controllers/AgreementAdminController";
import {
  validateAgreementTemplateActivation,
  validateAgreementTemplateUpload,
} from "../../middleware/agreementsMiddleware";

const BASE_PATH = "/agreements";
const BASE_ADMIN_PATH = `${BASE_PATH}/admin`;

const agreementController = new AgreementController();
const agreementAdminController = new AgreementAdminController();

const agreementApiHandlers = {
  [`GET ${BASE_PATH}/current`]: agreementController.getCurrentAgreement,
  [`POST ${BASE_PATH}/sign`]: agreementController.signAgreement,
  [`GET ${BASE_ADMIN_PATH}/signed`]: agreementAdminController.listSignedAgreements,
  [`GET ${BASE_ADMIN_PATH}/signed/download`]:
    agreementAdminController.getSignedAgreementDownloadUrl,
  [`POST ${BASE_ADMIN_PATH}/templates/upload-url`]:
    agreementAdminController.createTemplateUploadUrl,
  [`POST ${BASE_ADMIN_PATH}/templates/activate`]: agreementAdminController.activateTemplateVersion,
};

const agreementValidators = {
  [`POST ${BASE_PATH}/sign`]: validateAgreementSign,
  [`POST ${BASE_ADMIN_PATH}/templates/upload-url`]: validateAgreementTemplateUpload,
  [`POST ${BASE_ADMIN_PATH}/templates/activate`]: validateAgreementTemplateActivation,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, agreementApiHandlers, agreementValidators);
};
