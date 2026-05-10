import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AnalyticsController } from "../../controllers/analyticsController";
import { scheduleUserChecks } from "../../middleware/analyticsMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/analytics";

const analyticsApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/checkIns`]: {
    handler: AnalyticsController.getAllCheckInUsers,
    access: "trainerOrAdmin",
    middlewares: [scheduleUserChecks],
  },
  [`PATCH ${BASE_PATH}/checkIns/one`]: {
    handler: AnalyticsController.checkOffUser,
    access: "trainerOrAdmin",
    middlewares: [scheduleUserChecks],
  },
  [`GET ${BASE_PATH}/users`]: {
    handler: AnalyticsController.getUsersWithNoPlans,
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/users/expiring`]: {
    handler: AnalyticsController.getUsersFinishingThisMonth,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, analyticsApiRoutes);
};
