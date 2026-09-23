import { APIGatewayEvent } from "aws-lambda";
import {
  createValidatorResponse,
  stripClientTrainerIdFromBody,
  validateBody,
} from "../utils/utils";
import { blogPostSchemaValidator } from "../models/blogsModel";

export const validateBlogPost = (event: APIGatewayEvent) => {
  stripClientTrainerIdFromBody(event);
  const { isValid, message } = validateBody(event, blogPostSchemaValidator);

  return createValidatorResponse(isValid, message);
};
