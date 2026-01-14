import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AgreementController } from "../../controllers/AgreementController";
import { validateAgreementSign } from "../../middleware/agreementsMiddleware";

const BASE_PATH = "/agreements";
const agreementController = new AgreementController();

const agreementApiHandlers = {
  [`GET ${BASE_PATH}/current`]: agreementController.getCurrentAgreement,
  [`POST ${BASE_PATH}/sign`]: agreementController.signAgreement,
};

const agreementValidators = {
  [`POST ${BASE_PATH}/sign`]: validateAgreementSign,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, agreementApiHandlers, agreementValidators);
};
