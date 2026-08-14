import { Document, Types } from "mongoose";

export type FoodMeasurementUnit = "g" | "ml";

export interface NutritionValues {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  saturatedFat: number | null;
  sugars: number | null;
  fiber: number | null;
  sodium: number | null;
  salt: number | null;
}

export interface LocalizedFoodNames {
  he: string | null;
  en: string | null;
  original: string | null;
  originalLanguage: string | null;
}

export interface FoodMeasurement {
  description: string | null;
  quantity: number | null;
  unit: FoodMeasurementUnit | null;
}

export interface FoodServing {
  description: string;
  quantity: number;
  unit: FoodMeasurementUnit;
  source: "open_food_facts" | "fallback_100";
}

export interface FoodCatalogProviderData {
  identifiers: {
    barcode: string | null;
    barcodeAliases: string[];
    providerId: string | null;
  };
  names: LocalizedFoodNames;
  brand: string | null;
  imageUrl: string | null;
  package: FoodMeasurement;
  serving: FoodServing | null;
  nutrition: {
    basisUnit: FoodMeasurementUnit | null;
    per100: NutritionValues;
    perServing: NutritionValues;
  };
  dataQuality: {
    status: "complete" | "partial";
    missingFields: string[];
    errors: string[];
    warnings: string[];
  };
}

export interface FoodCatalogAdminOverrides {
  names?: Partial<LocalizedFoodNames>;
  brand?: string | null;
  imageUrl?: string | null;
  package?: Partial<FoodMeasurement> | null;
  serving?: Partial<FoodServing> | null;
  nutrition?: {
    basisUnit?: FoodMeasurementUnit | null;
    per100?: Partial<NutritionValues>;
    perServing?: Partial<NutritionValues>;
  };
  updatedAt: Date;
  updatedBy: Types.ObjectId;
  reason?: string;
}

export interface IFoodCatalogItem extends Document {
  providerData: FoodCatalogProviderData;
  adminOverrides: FoodCatalogAdminOverrides | null;
  search: {
    normalizedNames: string[];
    normalizedBrand: string | null;
    aliases: string[];
    prefixes: string[];
  };
  source: {
    provider: "open_food_facts" | "admin" | "future_provider";
    providerId: string | null;
    schemaVersion: number | null;
    sourceLastModifiedAt: Date | null;
    normalizedDataHash: string;
    lastFetchAttemptAt: Date | null;
    lastSuccessfulFetchAt: Date | null;
    nextRefreshAt: Date | null;
    consecutiveFailures: number;
    refreshLeaseUntil: Date | null;
  };
  analytics: {
    lookupCount: number;
    consumptionCount: number;
    lastLookedUpAt: Date | null;
    lastConsumedAt: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NormalizedOpenFoodFactsProduct {
  providerData: FoodCatalogProviderData;
  schemaVersion: number | null;
  sourceLastModifiedAt: Date | null;
  normalizedDataHash: string;
}
