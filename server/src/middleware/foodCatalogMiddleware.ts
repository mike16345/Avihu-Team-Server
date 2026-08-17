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

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).max(80).allow(""),
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
    servings: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().trim().max(100).required(),
          description: Joi.string().trim().min(1).max(200).required(),
          quantity: Joi.number().positive().required(),
          unit: Joi.string().trim().min(1).max(50).required(),
          nutrition: nutritionValues.required(),
          source: Joi.string().valid("open_food_facts", "fallback_100", "admin").required(),
        }).unknown(false)
      )
      .min(1)
      .allow(null),
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

const manualCoreNutrition = Joi.object({
  calories: Joi.number().min(0).required(),
  protein: Joi.number().min(0).required(),
  carbohydrates: Joi.number().min(0).required(),
  fat: Joi.number().min(0).required(),
  saturatedFat: nullableNutrient,
  sugars: nullableNutrient,
  fiber: nullableNutrient,
  sodium: nullableNutrient,
  salt: nullableNutrient,
}).unknown(false);

const manualFoodCatalogItemSchema = Joi.object({
  names: Joi.object({
    he: nullableText,
    en: nullableText,
    original: nullableText,
    originalLanguage: Joi.string().trim().max(10).allow(null),
  })
    .or("he", "en", "original")
    .required()
    .unknown(false),
  brand: nullableText,
  aliases: Joi.array().items(Joi.string().trim().min(1).max(100)).max(30),
  servings: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().trim().max(100),
        description: Joi.string().trim().min(1).max(200).required(),
        quantity: Joi.number().positive().required(),
        unit: Joi.string().trim().min(1).max(50).required(),
        nutrition: manualCoreNutrition.required(),
      }).unknown(false)
    )
    .min(1)
    .required(),
}).unknown(false);

export const validateFoodCatalogLookup = (event: APIGatewayProxyEvent) => {
  const { error } = barcodeQuerySchema.validate(event.queryStringParameters ?? {});
  return createValidatorResponse(!error, error?.message);
};

export const validateFoodCatalogSearch = (event: APIGatewayProxyEvent) => {
  const { error } = searchQuerySchema.validate(event.queryStringParameters ?? {});
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

export const validateManualFoodCatalogItem = (event: APIGatewayProxyEvent) => {
  try {
    const { error } = manualFoodCatalogItemSchema.validate(extractBodyFromEvent(event));
    return createValidatorResponse(!error, error?.message);
  } catch (_error) {
    return createValidatorResponse(false, "Request body must be valid JSON.");
  }
};

export const validateManualFoodCatalogItemUpdate = (event: APIGatewayProxyEvent) => {
  const queryResult = itemQuerySchema.validate(event.queryStringParameters ?? {});
  if (queryResult.error) return createValidatorResponse(false, queryResult.error.message);
  return validateManualFoodCatalogItem(event);
};
