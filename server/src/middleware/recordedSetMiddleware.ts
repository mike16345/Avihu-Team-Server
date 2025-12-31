import Joi from "joi";
import { RecordedSetJoiSchema } from "../models/recordedSetsModel";
import { createValidatorResponse, extractBodyFromEvent, removeNestedIds } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";
import mongoose from "mongoose";

export const validateRecordedSet = (event: APIGatewayEvent) => {
  const { userId, muscleGroup, exercise, exerciseId, recordedSets } = extractBodyFromEvent(event);
  const data = removeNestedIds(recordedSets);
  let message = "";
  const allowLegacy = process.env.ALLOW_LEGACY_EXERCISE_NAME_ONLY === "true";
  const isProd = event.requestContext?.stage === "prod" || process.env.STAGE === "prod";
  const requiresExerciseId = isProd && !allowLegacy;
  const hasValidExerciseId =
    typeof exerciseId === "string" && mongoose.Types.ObjectId.isValid(exerciseId);

  if (!userId) {
    message = "userId is required";
  }

  if (!exercise) {
    message = "exercise is required";
  }

  if (requiresExerciseId && !hasValidExerciseId) {
    message = "exerciseId is required";
  }

  if (message) {
    return createValidatorResponse(false, message);
  }

  if (!requiresExerciseId && !hasValidExerciseId) {
    console.warn({
      service: "RecordedSetMiddleware.validateRecordedSet",
      message: "Missing or invalid exerciseId; allowing legacy exercise key",
      userId,
      muscleGroup,
      exercise,
      stage: event.requestContext?.stage,
      timestamp: new Date().toISOString(),
    });
  }

  const sets = Array.isArray(data) ? data : [data];

  for (const set of sets) {
    const { error: joiError } = RecordedSetJoiSchema.validate(set);

    if (joiError) {
      return createValidatorResponse(false, joiError?.message);
    }
  }

  return createValidatorResponse(true);
};
