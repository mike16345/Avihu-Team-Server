import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import SessionController from "../../controllers/SessionController";

const BASE_PATH = "/sessions";
const sessionApiHandlers = {
  [`GET ${BASE_PATH}/one`]: SessionController.getSessionById,
  [`GET ${BASE_PATH}/type`]: SessionController.getSessionsByType,
  [`PUT ${BASE_PATH}/one`]: SessionController.refreshSession,
  [`POST ${BASE_PATH}`]: SessionController.startSession,
  [`DELETE ${BASE_PATH}/one`]: SessionController.endSession,
  [`DELETE ${BASE_PATH}/all`]: SessionController.endAllSessions,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, sessionApiHandlers);
};
