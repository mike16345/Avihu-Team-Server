import { FullWorkoutPlanSchemaValidation } from "../models/workoutPlanModel";
import { StatusCode } from "../enums/StatusCode";
import { WorkoutPlanPresetSchemaValidation } from "../models/workoutPlanPresetModel";
import { createResponse, createValidatorResponse } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateWorkoutPlan = (event: APIGatewayEvent) => {
  const { id } = event?.queryStringParameters || {};
  const body = JSON.parse(event?.body || "{}");

  if (!id) {
    return createValidatorResponse(true, "User ID is required!");
  }

  const { error } = FullWorkoutPlanSchemaValidation.validate(body);
  return createValidatorResponse(!!error, error?.message);
};

export const validateWorkoutPlanPreset = (event: APIGatewayEvent) => {
  const { error } = WorkoutPlanPresetSchemaValidation.validate(event.body);

  return createValidatorResponse(!!error, error?.message);
};
