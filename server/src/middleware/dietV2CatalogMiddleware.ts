import { APIGatewayProxyEvent } from "aws-lambda";
import Joi from "joi";
import { DIET_V2_CATALOG_CATEGORIES } from "../interfaces/IDietPlanV2";
import { createValidatorResponse } from "../utils/utils";

const searchSchema = Joi.object({
  category: Joi.string()
    .valid(...DIET_V2_CATALOG_CATEGORIES)
    .required(),
  q: Joi.string().trim().min(1).max(200).required(),
});

const deleteSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const validateDietV2CatalogSearch = (event: APIGatewayProxyEvent) => {
  const { error } = searchSchema.validate(event.queryStringParameters ?? {});

  return createValidatorResponse(!error, error?.message);
};

export const validateDietV2CatalogDelete = (event: APIGatewayProxyEvent) => {
  const { error } = deleteSchema.validate(event.queryStringParameters ?? {});

  return createValidatorResponse(!error, error?.message);
};
