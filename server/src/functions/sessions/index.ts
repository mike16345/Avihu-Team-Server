import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import SessionController from "../../controllers/SessionController";

const BASE_PATH = "/sessions";

const sessionController = new SessionController();

const sessionApiHandlers = {
  [`GET ${BASE_PATH}/one`]: sessionController.getSessionById,
  [`GET ${BASE_PATH}`]: sessionController.getAll,
  [`PUT ${BASE_PATH}/one`]: sessionController.refreshSession,
  [`POST ${BASE_PATH}`]: sessionController.startSession,
  [`PUT ${BASE_PATH}/update`]: sessionController.updateSession,
  [`DELETE ${BASE_PATH}/one`]: sessionController.endSession,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, sessionApiHandlers);
};
