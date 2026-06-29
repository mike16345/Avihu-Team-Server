import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import StepsProgressController from "../../controllers/stepsProgressController";
import { handleApiCall } from "../baseHandler";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
import { validateStepsSync } from "../../middleware/stepsProgressMiddleware";

const BASE_PATH = "/steps";

const stepsProgressController = new StepsProgressController();

const stepsApiRoutes: ApiRouteHandlers = {
  [`POST ${BASE_PATH}/sync`]: {
    handler: stepsProgressController.syncMine,
    access: "authenticated",
    middlewares: [validateStepsSync],
  },
  [`GET ${BASE_PATH}/me`]: {
    handler: stepsProgressController.getMine,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: stepsProgressController.getByUserId,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, stepsApiRoutes);
};
