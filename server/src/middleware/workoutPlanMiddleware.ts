import { FullWorkoutPlanSchemaValidation } from "../models/workoutPlanModel";
import { WorkoutPlanPresetSchemaValidation } from "../models/workoutPlanPresetModel";
import {
  createValidatorResponse,
  extractBodyFromEvent,
  extractQueryFromEvent,
  removeNestedIds,
} from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";
import { sanitizeWorkoutPlanForInsert } from "../utils/workoutPlanUtils";

export const validateWorkoutPlan = (event: APIGatewayEvent) => {
  const { id, userId } = extractQueryFromEvent(event);
  const body = extractBodyFromEvent(event);
  const cleanedPlan = removeNestedIds(sanitizeWorkoutPlanForInsert(body));

  if (!id && !userId) {
    return createValidatorResponse(false, "User ID is required!");
  }

  const { error } = FullWorkoutPlanSchemaValidation.validate(cleanedPlan);
  const isValid = !error;
  return createValidatorResponse(isValid, error?.message);
};

export const validateWorkoutPlanPreset = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);
  const cleanedPlan = removeNestedIds(sanitizeWorkoutPlanForInsert(body));

  const { error } = WorkoutPlanPresetSchemaValidation.validate(cleanedPlan);
  const isValid = !error;

  return createValidatorResponse(isValid, error?.message);
};
