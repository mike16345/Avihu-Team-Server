import Joi from "joi";
import { RecordedSetJoiSchema } from "../models/recordedSetsModel";
import { createValidatorResponse, extractBodyFromEvent, removeNestedIds } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";
import mongoose from "mongoose";

export const validateRecordedSet = (event: APIGatewayEvent) => {
  const { userId, muscleGroup, exercise, recordedSets, exerciseId } = extractBodyFromEvent(event);
  const data = removeNestedIds(recordedSets);
  let message = "";

  if (!userId) {
    message = "userId is required";
  }

  if (!exercise) {
    message = "exercise is required";
  }

  if (message) {
    return createValidatorResponse(false, message);
  }

  if (exerciseId && !mongoose.isValidObjectId(exerciseId)) {
    return createValidatorResponse(false, "exerciseId is invalid");
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
