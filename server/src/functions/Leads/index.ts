import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import LeadsController from "../../controllers/LeadsController";
import { validateCreateLead, validateUpdateLead } from "../../middleware/leadsMiddleware";

const BASE_PATH = "/leads";

const leadsController = new LeadsController();

const leadsApiHandlers = {
  [`POST ${BASE_PATH}`]: leadsController.create,
  [`GET ${BASE_PATH}`]: leadsController.list,
  [`GET ${BASE_PATH}/{id}`]: leadsController.getById,
  [`PUT ${BASE_PATH}/{id}`]: leadsController.update,
  [`DELETE ${BASE_PATH}/{id}`]: leadsController.remove,
};

const leadsApiValidators = {
  [`POST ${BASE_PATH}`]: validateCreateLead,
  [`PUT ${BASE_PATH}/{id}`]: validateUpdateLead,
};

const normalizeEventPath = (event: APIGatewayProxyEvent): APIGatewayProxyEvent => {
  const match = event.path?.match(new RegExp(`^${BASE_PATH}/([^/]+)$`));

  if (match && match[1]) {
    const leadId = decodeURIComponent(match[1]);

    return {
      ...event,
      path: `${BASE_PATH}/{id}`,
      pathParameters: {
        ...(event.pathParameters || {}),
        id: leadId,
      },
    } as APIGatewayProxyEvent;
  }

  return event;
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const normalizedEvent = normalizeEventPath(event);

  return handleApiCall(normalizedEvent, context, leadsApiHandlers, leadsApiValidators);
};
