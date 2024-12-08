import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import PasswordsController from "../../controllers/passwordsController";

const BASE_PATH = "/passwords";

const otpApiHandlers = {
  [`POST ${BASE_PATH}`]: PasswordsController.hashPassword,
  [`PUT ${BASE_PATH}`]: PasswordsController.updatePassword,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, otpApiHandlers);
};
