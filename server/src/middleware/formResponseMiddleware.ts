import { APIGatewayEvent } from "aws-lambda";
import { formResponseValidator } from "../models/formResponseModel";
import { createValidatorResponse, extractBodyFromEvent } from "../utils/utils";

export const validateFormResponse = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);
  const { error } = formResponseValidator.validate(body);
  const isValid = !error;

  return createValidatorResponse(isValid, error?.message);
};
