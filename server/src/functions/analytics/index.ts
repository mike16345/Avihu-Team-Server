import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { AnalyticsController } from "../../controllers/analyticsController";

const BASE_PATH = "/analytics/checkIns";

const analyticsApiHandlers = {
  [`GET ${BASE_PATH}`]: AnalyticsController.getAllCheckInUsers,
  [`PATCH ${BASE_PATH}/one`]: AnalyticsController.checkOffUser, // Delete user by ID
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, analyticsApiHandlers);
};
