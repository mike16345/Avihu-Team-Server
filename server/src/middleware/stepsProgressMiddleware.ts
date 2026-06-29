import { APIGatewayEvent } from "aws-lambda";
import { stepsSyncValidationSchema } from "../models/stepsProgressModel";
import { createValidatorResponse, extractBodyFromEvent } from "../utils/utils";

export const validateStepsSync = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);
  const { error } = stepsSyncValidationSchema.validate(body);

  return createValidatorResponse(!error, error?.message);
};
