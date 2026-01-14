import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AgreementAdminController } from "../../controllers/AgreementAdminController";
import {
  validateAgreementTemplateActivation,
  validateAgreementTemplateUpload,
} from "../../middleware/agreementsMiddleware";

const BASE_PATH = "/admin/agreements";
const agreementAdminController = new AgreementAdminController();

const adminApiHandlers = {
  [`GET ${BASE_PATH}/signed`]: agreementAdminController.listSignedAgreements,
  [`GET ${BASE_PATH}/signed/download`]: agreementAdminController.getSignedAgreementDownloadUrl,
  [`POST ${BASE_PATH}/templates/upload-url`]: agreementAdminController.createTemplateUploadUrl,
  [`POST ${BASE_PATH}/templates/activate`]: agreementAdminController.activateTemplateVersion,
};

const adminValidators = {
  [`POST ${BASE_PATH}/templates/upload-url`]: validateAgreementTemplateUpload,
  [`POST ${BASE_PATH}/templates/activate`]: validateAgreementTemplateActivation,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, adminApiHandlers, adminValidators);
};
