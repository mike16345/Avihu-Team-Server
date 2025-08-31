import { APIGatewayEvent } from "aws-lambda";
import { createValidatorResponse, extractBodyFromEvent, removeNestedIds } from "../utils/utils";
import { progressNoteSchemaValidator } from "../models/userProgressNotes";

export const validateUserProgressNote = (event: APIGatewayEvent) => {
  const { userId, progressNote } = extractBodyFromEvent(event);
  const data = removeNestedIds(progressNote);
  let message = "";

  if (!userId) {
    message = "userId is required";
  }

  if (message) {
    return createValidatorResponse(false, message);
  }

  const { error } = progressNoteSchemaValidator.validate(data);
  const isValid = !error;

  return createValidatorResponse(isValid, error?.message);
};
