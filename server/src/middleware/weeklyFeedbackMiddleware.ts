import { APIGatewayEvent } from "aws-lambda";
import { WeeklyFeedbackValidation } from "../models/weeklyFeedbackModel";
import { validateBody } from "../utils/utils";

export const validateWeeklyFeedback = (event: APIGatewayEvent) => {
  return validateBody(event, WeeklyFeedbackValidation);
};
