import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { RagController } from "../../controllers/ragController";

const BASE_PATH = "/rag";
const controller = new RagController();

const handlers = {
  [`POST ${BASE_PATH}/query`]: controller.ask,
  [`POST ${BASE_PATH}/ingest`]: controller.ingest,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, handlers);
};
