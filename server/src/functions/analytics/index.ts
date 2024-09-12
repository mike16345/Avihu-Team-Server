import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AnalyticsController } from "../../controllers/analyticsController";

const BASE_PATH = "/analytics";

const analyticsApiHandlers = {
  [`GET ${BASE_PATH}/checkIns`]: AnalyticsController.getAllCheckInUsers,
  [`PATCH ${BASE_PATH}/checkIns/one`]: AnalyticsController.checkOffUser, // Delete user by ID
  [`GET ${BASE_PATH}/users`]: AnalyticsController.getUsersWithNoPlans,
  [`GET ${BASE_PATH}/users/expiring`]: AnalyticsController.getUsersFinishingThisMonth,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, analyticsApiHandlers);
};
