import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { RagController } from "../../controllers/ragController";

type LambdaWarmerEvent = {
  type: "keep warm";
  source: "event-bridge";
};

function isEventBridgeWarm(e: any): e is LambdaWarmerEvent {
  return (
    typeof e === "object" &&
    e !== null &&
    "source" in e &&
    (e as any).source === "event-bridge" &&
    e.type == "keepWarm"
  );
}

const BASE_PATH = "/rag";
const controller = new RagController();

const handlers = {
  [`POST ${BASE_PATH}/query`]: controller.ask,
  [`POST ${BASE_PATH}/ingest`]: controller.ingest,
};

export const handler = async (
  event: APIGatewayProxyEvent | LambdaWarmerEvent,
  context: Context
): Promise<APIGatewayProxyResult | undefined> => {
  if (isEventBridgeWarm(event)) {
    console.log("Lambda keep-warm ping, skipping heavy logic");

    return Promise.resolve({ statusCode: 200, body: JSON.stringify({ ok: true, warm: true }) });
  }

  return await handleApiCall(event as APIGatewayProxyEvent, context, handlers);
};
