import { FullWorkoutPlanSchemaValidation } from "../models/workoutPlanModel";
import { WorkoutPlanPresetSchemaValidation } from "../models/workoutPlanPresetModel";
import {
  createValidatorResponse,
  extractBodyFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateWorkoutPlan = (event: APIGatewayEvent) => {
  const { id, userId } = extractQueryFromEvent(event);
  const body = extractBodyFromEvent(event);

  if (!id && !userId) {
    return createValidatorResponse(false, "User ID is required!");
  }

  const { error } = FullWorkoutPlanSchemaValidation.validate(body);
  const isValid = !error;
  return createValidatorResponse(isValid, error?.message);
};

export const validateWorkoutPlanPreset = (event: APIGatewayEvent) => {
  const body = JSON.parse(event?.body || "{}");

  const { error } = WorkoutPlanPresetSchemaValidation.validate(body);
  const isValid = !error;

  return createValidatorResponse(isValid, error?.message);
};
