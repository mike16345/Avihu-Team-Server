import { RecordedSetJoiSchema } from "../models/recordedSetsModel";
import { createValidatorResponse, extractBodyFromEvent, removeNestedIds } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateRecordedSet = (event: APIGatewayEvent) => {
  const { userId, muscleGroup, exercise, recordedSet } = extractBodyFromEvent(event);
  const data = removeNestedIds(recordedSet);
  let message = "";

  if (!userId) {
    message = "userId is required";
  }

  if (!muscleGroup) {
    message = "muscleGroup is required";
  }

  if (!exercise) {
    message = "exercise is required";
  }

  if (message) {
    return createValidatorResponse(false, message);
  }

  const { error } = RecordedSetJoiSchema.validate(data);
  const isValid = !error;

  return createValidatorResponse(isValid, error?.message);
};
