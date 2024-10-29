import { APIGatewayEvent } from "aws-lambda";
import { createValidatorResponse,  validateBody } from "../utils/utils";
import { userImageSchemaValidator } from "../models/urlModel";

export const validateUserImageUrl = (event: APIGatewayEvent) => {
  const { isValid, message } = validateBody(event, userImageSchemaValidator);

  return createValidatorResponse(isValid, message);
};
