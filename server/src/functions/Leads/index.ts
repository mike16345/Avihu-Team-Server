import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import LeadsController from "../../controllers/LeadsController";
import { validateCreateLead } from "../../middleware/leadsMiddleware";

const BASE_PATH = "/leads";

const leadsController = new LeadsController();

const leadsApiHandlers = {
  [`POST ${BASE_PATH}`]: leadsController.create,
  [`GET ${BASE_PATH}`]: leadsController.list,
  [`GET ${BASE_PATH}/one`]: leadsController.getById,
  [`PUT ${BASE_PATH}/one`]: leadsController.update,
  [`DELETE ${BASE_PATH}/one`]: leadsController.remove,
};

const leadsApiValidators = {
  [`POST ${BASE_PATH}`]: validateCreateLead,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, leadsApiHandlers, leadsApiValidators);
};
