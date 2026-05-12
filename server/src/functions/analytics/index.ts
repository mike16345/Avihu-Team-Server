import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AnalyticsController } from "../../controllers/analyticsController";
import { scheduleUserChecks } from "../../middleware/analyticsMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/analytics";

const analyticsApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/checkIns`]: {
    handler: AnalyticsController.getAllCheckInUsers,
    access: "subtrainer",
    middlewares: [scheduleUserChecks],
  },
  [`PATCH ${BASE_PATH}/checkIns/one`]: {
    handler: AnalyticsController.checkOffUser,
    access: "subtrainer",
    middlewares: [scheduleUserChecks],
  },
  [`GET ${BASE_PATH}/users`]: {
    handler: AnalyticsController.getUsersWithNoPlans,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/users/expiring`]: {
    handler: AnalyticsController.getUsersFinishingThisMonth,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/dashboard/summary`]: {
    handler: AnalyticsController.getDashboardSummary,
    access: "admin",
  },
  [`GET ${BASE_PATH}/dashboard/sources`]: {
    handler: AnalyticsController.getDashboardSources,
    access: "admin",
  },
  [`GET ${BASE_PATH}/dashboard/joinedByMonth`]: {
    handler: AnalyticsController.getDashboardJoinedByMonth,
    access: "admin",
  },
  [`GET ${BASE_PATH}/dashboard/closeToLimit`]: {
    handler: AnalyticsController.getDashboardTrainersCloseToLimit,
    access: "admin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, analyticsApiRoutes);
};
