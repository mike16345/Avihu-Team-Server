import { APIGatewayProxyEvent } from "aws-lambda";
import Joi from "joi";
import { createValidatorResponse, extractBodyFromEvent } from "../utils/utils";

const itemQuerySchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).unknown(false);

const barcodeQuerySchema = Joi.object({
  barcode: Joi.string()
    .trim()
    .pattern(/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/)
    .required(),
}).unknown(false);

const nullableText = Joi.string().trim().max(500).allow(null);
const nullableNutrient = Joi.number().min(0).allow(null);
const nutritionValues = Joi.object({
  calories: nullableNutrient,
  protein: nullableNutrient,
  carbohydrates: nullableNutrient,
  fat: nullableNutrient,
  saturatedFat: nullableNutrient,
  sugars: nullableNutrient,
  fiber: nullableNutrient,
  sodium: nullableNutrient,
  salt: nullableNutrient,
})
  .min(1)
  .unknown(false);

const overrideBodySchema = Joi.object({
  overrides: Joi.object({
    names: Joi.object({
      he: nullableText,
      en: nullableText,
      original: nullableText,
      originalLanguage: Joi.string().trim().max(10).allow(null),
    })
      .min(1)
      .unknown(false),
    brand: nullableText,
    imageUrl: Joi.string().uri().allow(null),
    package: Joi.object({
      description: nullableText,
      quantity: Joi.number().min(0).allow(null),
      unit: Joi.string().valid("g", "ml").allow(null),
    })
      .min(1)
      .allow(null)
      .unknown(false),
    serving: Joi.object({
      description: nullableText,
      quantity: Joi.number().positive().allow(null),
      unit: Joi.string().valid("g", "ml").allow(null),
      source: Joi.string().valid("open_food_facts", "fallback_100").allow(null),
    })
      .min(1)
      .allow(null)
      .unknown(false),
    nutrition: Joi.object({
      basisUnit: Joi.string().valid("g", "ml").allow(null),
      per100: nutritionValues,
      perServing: nutritionValues,
    })
      .min(1)
      .unknown(false),
  })
    .min(1)
    .required()
    .unknown(false),
  reason: Joi.string().trim().max(500),
}).unknown(false);

export const validateFoodCatalogLookup = (event: APIGatewayProxyEvent) => {
  const { error } = barcodeQuerySchema.validate(event.queryStringParameters ?? {});
  return createValidatorResponse(!error, error?.message);
};

export const validateFoodCatalogItemId = (event: APIGatewayProxyEvent) => {
  const { error } = itemQuerySchema.validate(event.queryStringParameters ?? {});
  return createValidatorResponse(!error, error?.message);
};

export const validateFoodCatalogOverride = (event: APIGatewayProxyEvent) => {
  const queryResult = itemQuerySchema.validate(event.queryStringParameters ?? {});
  if (queryResult.error) return createValidatorResponse(false, queryResult.error.message);
  try {
    const { error } = overrideBodySchema.validate(extractBodyFromEvent(event));
    return createValidatorResponse(!error, error?.message);
  } catch (_error) {
    return createValidatorResponse(false, "Request body must be valid JSON.");
  }
};
