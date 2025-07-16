import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import PasswordsController from "../../controllers/passwordsController";

const BASE_PATH = "/passwords";

const PasswordController = new PasswordsController();

const passwordApiHandlers = {
  [`POST ${BASE_PATH}`]: PasswordController.hashPassword,
  [`PUT ${BASE_PATH}`]: PasswordController.updatePassword,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, passwordApiHandlers);
};
