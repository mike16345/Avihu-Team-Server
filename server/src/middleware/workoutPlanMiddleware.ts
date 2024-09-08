import { FullWorkoutPlanSchemaValidation } from "../models/workoutPlanModel";
import { StatusCode } from "../enums/StatusCode";
import { WorkoutPlanPresetSchemaValidation } from "../models/workoutPlanPresetModel";
import { createResponse, createValidatorResponse } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateWorkoutPlan = (event: APIGatewayEvent) => {
  const { id, userId } = event?.queryStringParameters || {};
  const body = JSON.parse(event?.body || "{}");

  if (!id && !userId) {
    return createValidatorResponse(true, "User ID is required!");
  }

  const { error } = FullWorkoutPlanSchemaValidation.validate(body);
  const isValid = !error;
  return createValidatorResponse(isValid, error?.message);
};

export const validateWorkoutPlanPreset = (event: APIGatewayEvent) => {
  const body = JSON.parse(event?.body || "{}");

  const { error } = WorkoutPlanPresetSchemaValidation.validate(body);

  return createValidatorResponse(!!error, error?.message);
};
