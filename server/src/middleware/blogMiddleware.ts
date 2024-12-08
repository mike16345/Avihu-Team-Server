import { APIGatewayEvent } from "aws-lambda";
import { createValidatorResponse, validateBody } from "../utils/utils";
import { blogPostSchemaValidator } from "../models/blogsModel";

export const validateBlogPost = (event: APIGatewayEvent) => {
  const { isValid, message } = validateBody(event, blogPostSchemaValidator);

  return createValidatorResponse(isValid, message);
};
