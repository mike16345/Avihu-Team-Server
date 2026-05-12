import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AgreementController } from "../../controllers/AgreementController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
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

const agreementApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/current`]: {
    handler: agreementController.getCurrentAgreement,
    access: "public",
  },
  [`POST ${BASE_PATH}/sign`]: {
    handler: agreementController.signAgreement,
    access: "public",
    middlewares: [validateAgreementSign],
  },
  [`GET ${BASE_ADMIN_PATH}/signed`]: {
    handler: agreementAdminController.listSignedAgreements,
    access: "trainer",
  },
  [`GET ${BASE_ADMIN_PATH}/signed/download`]: {
    handler: agreementAdminController.getSignedAgreementDownloadUrl,
    access: "trainer",
  },
  [`POST ${BASE_ADMIN_PATH}/templates/upload-url`]: {
    handler: agreementAdminController.createTemplateUploadUrl,
    access: "trainer",
    middlewares: [validateAgreementTemplateUpload],
  },
  [`POST ${BASE_ADMIN_PATH}/templates/activate`]: {
    handler: agreementAdminController.activateTemplateVersion,
    access: "trainer",
    middlewares: [validateAgreementTemplateActivation],
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, agreementApiRoutes);
};
