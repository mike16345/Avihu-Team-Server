import { model, Schema } from "mongoose";
import { IFoodCatalogItem } from "../interfaces/IFoodCatalogItem";

export const FOOD_CATALOG_COLLECTION = "foodcatalogitems";

const nullableNutritionField = { type: Number, min: 0, default: null };
const nutritionValuesSchema = new Schema(
  {
    calories: nullableNutritionField,
    protein: nullableNutritionField,
    carbohydrates: nullableNutritionField,
    fat: nullableNutritionField,
    saturatedFat: nullableNutritionField,
    sugars: nullableNutritionField,
    fiber: nullableNutritionField,
    sodium: nullableNutritionField,
    salt: nullableNutritionField,
  },
  { _id: false, strict: "throw" }
);

const namesSchema = new Schema(
  {
    he: { type: String, default: null },
    en: { type: String, default: null },
    original: { type: String, default: null },
    originalLanguage: { type: String, default: null },
  },
  { _id: false, strict: "throw" }
);

const measurementSchema = new Schema(
  {
    description: { type: String, default: null },
    quantity: { type: Number, min: 0, default: null },
    unit: { type: String, enum: ["g", "ml", null], default: null },
  },
  { _id: false, strict: "throw" }
);

const servingSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ["g", "ml"] },
    source: { type: String, required: true, enum: ["open_food_facts", "fallback_100"] },
  },
  { _id: false, strict: "throw" }
);

const providerDataSchema = new Schema(
  {
    identifiers: {
      barcode: { type: String, default: null },
      barcodeAliases: { type: [String], default: [] },
      providerId: { type: String, default: null },
    },
    names: { type: namesSchema, required: true },
    brand: { type: String, default: null },
    imageUrl: { type: String, default: null },
    package: { type: measurementSchema, required: true },
    serving: { type: servingSchema, default: null },
    nutrition: {
      basisUnit: { type: String, enum: ["g", "ml", null], default: null },
      per100: { type: nutritionValuesSchema, required: true },
      perServing: { type: nutritionValuesSchema, required: true },
    },
    dataQuality: {
      status: { type: String, required: true, enum: ["complete", "partial"] },
      missingFields: { type: [String], default: [] },
      errors: { type: [String], default: [] },
      warnings: { type: [String], default: [] },
    },
  },
  { _id: false, strict: "throw" }
);

const adminOverridesSchema = new Schema(
  {
    names: { type: namesSchema, required: false },
    brand: { type: String, required: false },
    imageUrl: { type: String, required: false },
    package: { type: measurementSchema, required: false },
    serving: { type: servingSchema, required: false },
    nutrition: {
      type: new Schema(
        {
          basisUnit: { type: String, enum: ["g", "ml", null], required: false },
          per100: { type: nutritionValuesSchema, required: false },
          perServing: { type: nutritionValuesSchema, required: false },
        },
        { _id: false, strict: "throw" }
      ),
      required: false,
    },
    updatedAt: { type: Date, required: true },
    updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    reason: { type: String, required: false },
  },
  { _id: false, strict: "throw" }
);

export const foodCatalogItemSchema = new Schema<IFoodCatalogItem>(
  {
    providerData: { type: providerDataSchema, required: true },
    adminOverrides: { type: adminOverridesSchema, default: null },
    search: {
      normalizedNames: { type: [String], default: [] },
      normalizedBrand: { type: String, default: null },
      aliases: { type: [String], default: [] },
      prefixes: { type: [String], default: [] },
    },
    source: {
      provider: {
        type: String,
        required: true,
        enum: ["open_food_facts", "admin", "future_provider"],
      },
      providerId: { type: String, default: null },
      schemaVersion: { type: Number, default: null },
      sourceLastModifiedAt: { type: Date, default: null },
      normalizedDataHash: { type: String, required: true },
      lastFetchAttemptAt: { type: Date, default: null },
      lastSuccessfulFetchAt: { type: Date, default: null },
      nextRefreshAt: { type: Date, default: null },
      consecutiveFailures: { type: Number, required: true, min: 0, default: 0 },
      refreshLeaseUntil: { type: Date, default: null },
    },
    analytics: {
      lookupCount: { type: Number, required: true, min: 0, default: 0 },
      consumptionCount: { type: Number, required: true, min: 0, default: 0 },
      lastLookedUpAt: { type: Date, default: null },
      lastConsumedAt: { type: Date, default: null },
    },
  },
  {
    collection: FOOD_CATALOG_COLLECTION,
    timestamps: true,
    strict: "throw",
  }
);

foodCatalogItemSchema.index(
  { "providerData.identifiers.barcode": 1 },
  {
    unique: true,
    partialFilterExpression: { "providerData.identifiers.barcode": { $type: "string" } },
  }
);
foodCatalogItemSchema.index({ "providerData.identifiers.barcodeAliases": 1 });
foodCatalogItemSchema.index(
  { "source.provider": 1, "source.providerId": 1 },
  { unique: true, partialFilterExpression: { "source.providerId": { $type: "string" } } }
);
foodCatalogItemSchema.index({ "source.nextRefreshAt": 1 });
foodCatalogItemSchema.index({ "analytics.consumptionCount": -1 });
foodCatalogItemSchema.index({ "search.prefixes": 1, "analytics.consumptionCount": -1 });

export const FoodCatalogItemModel = model<IFoodCatalogItem>(
  "FoodCatalogItem",
  foodCatalogItemSchema,
  FOOD_CATALOG_COLLECTION
);
