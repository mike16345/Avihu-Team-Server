import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import LeadsController from "../../controllers/LeadsController";
import { validateCreateLead } from "../../middleware/leadsMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/leads";

const leadsController = new LeadsController();

const leadsApiRoutes: ApiRouteHandlers = {
  [`POST ${BASE_PATH}`]: {
    handler: leadsController.create,
    access: "public",
    middlewares: [validateCreateLead],
  },
  [`GET ${BASE_PATH}`]: {
    handler: leadsController.list,
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: leadsController.getById,
    access: "trainerOrAdmin",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: leadsController.update,
    access: "trainerOrAdmin",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: leadsController.remove,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, leadsApiRoutes);
};
