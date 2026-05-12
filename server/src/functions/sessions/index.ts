import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import SessionController from "../../controllers/SessionController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/sessions";

const sessionController = new SessionController();

const sessionApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/one`]: {
    handler: sessionController.getSessionById,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}`]: {
    handler: sessionController.getAll,
    access: "subtrainer",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: sessionController.refreshSession,
    access: "authenticated",
  },
  [`POST ${BASE_PATH}`]: {
    handler: sessionController.startSession,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/update`]: {
    handler: sessionController.updateSession,
    access: "authenticated",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: sessionController.endSession,
    access: "authenticated",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, sessionApiRoutes);
};
