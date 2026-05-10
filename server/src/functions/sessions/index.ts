import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import SessionController from "../../controllers/SessionController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/sessions";

const sessionController = new SessionController();

const sessionApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/one`]: {
    handler: sessionController.getSessionById,
    access: "public",
  },
  [`GET ${BASE_PATH}`]: {
    handler: sessionController.getAll,
    access: "trainerOrAdmin",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: sessionController.refreshSession,
    access: "public",
  },
  [`POST ${BASE_PATH}`]: {
    handler: sessionController.startSession,
    access: "public",
  },
  [`PUT ${BASE_PATH}/update`]: {
    handler: sessionController.updateSession,
    access: "public",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: sessionController.endSession,
    access: "public",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, sessionApiRoutes);
};
