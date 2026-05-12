import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import PasswordsController from "../../controllers/passwordsController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/passwords";

const PasswordController = new PasswordsController();

const passwordApiRoutes: ApiRouteHandlers = {
  [`POST ${BASE_PATH}`]: {
    handler: PasswordController.hashPassword,
    access: "trainer",
  },
  [`PUT ${BASE_PATH}`]: {
    handler: PasswordController.updatePassword,
    access: "public",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, passwordApiRoutes);
};
