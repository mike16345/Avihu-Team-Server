import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WeeklyFeedbackController from "../../controllers/weeklyFeedbackController";
import { handleApiCall } from "../baseHandler";
import { validateWeeklyFeedback } from "../../middleware/weeklyFeedbackMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/weeklyFeedback";

const weeklyFeedbackController = new WeeklyFeedbackController();

const weeklyFeedbackApiRoutes: ApiRouteHandlers = {
  [`POST ${BASE_PATH}`]: {
    handler: weeklyFeedbackController.upsertForCurrentUser,
    access: "authenticated",
    middlewares: [validateWeeklyFeedback],
  },
  [`GET ${BASE_PATH}/user/{id}`]: {
    handler: weeklyFeedbackController.getByUserId,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/user/{id}/week/{weekStart}`]: {
    handler: weeklyFeedbackController.getByWeek,
    access: "authenticated",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, weeklyFeedbackApiRoutes);
};
