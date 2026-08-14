import { createHash } from "crypto";
import {
  FoodCatalogProviderData,
  FoodMeasurementUnit,
  FoodServing,
  NormalizedOpenFoodFactsProduct,
  NutritionValues,
} from "../../interfaces/IFoodCatalogItem";

const NUTRIENT_FIELDS = {
  calories: "energy-kcal",
  protein: "proteins",
  carbohydrates: "carbohydrates",
  fat: "fat",
  saturatedFat: "saturated-fat",
  sugars: "sugars",
  fiber: "fiber",
  sodium: "sodium",
  salt: "salt",
} as const;

const trimOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const nonnegativeNumberOrNull = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const positiveNumberOrNull = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const unitOrNull = (value: unknown): FoodMeasurementUnit | null =>
  value === "g" || value === "ml" ? value : null;

const roundNutrition = (value: number): number => Number(value.toFixed(6));

const getNutrition = (nutriments: Record<string, unknown>, suffix: string): NutritionValues => {
  const values = Object.fromEntries(
    Object.entries(NUTRIENT_FIELDS).map(([key, sourceKey]) => [
      key,
      nonnegativeNumberOrNull(nutriments[`${sourceKey}_${suffix}`]),
    ])
  ) as unknown as NutritionValues;

  if (values.calories === null) {
    const kilojoules = nonnegativeNumberOrNull(nutriments[`energy-kj_${suffix}`]);
    if (kilojoules !== null) values.calories = roundNutrition(kilojoules / 4.184);
  }

  return values;
};

const calculateServingNutrition = (
  per100: NutritionValues,
  providerServing: NutritionValues,
  servingQuantity: number | null
): NutritionValues => {
  const factor = servingQuantity === null ? null : servingQuantity / 100;

  return Object.fromEntries(
    Object.keys(NUTRIENT_FIELDS).map((key) => {
      const nutrient = key as keyof NutritionValues;
      const supplied = providerServing[nutrient];
      const base = per100[nutrient];
      return [
        nutrient,
        supplied ?? (factor !== null && base !== null ? roundNutrition(base * factor) : null),
      ];
    })
  ) as unknown as NutritionValues;
};

const determineServing = (
  raw: Record<string, any>,
  basisUnit: FoodMeasurementUnit | null
): FoodServing | null => {
  const servingQuantity = positiveNumberOrNull(raw.serving_quantity);
  const servingUnit = unitOrNull(raw.serving_quantity_unit);

  if (servingQuantity !== null && servingUnit !== null) {
    return {
      description: trimOrNull(raw.serving_size) ?? `${servingQuantity} ${servingUnit}`,
      quantity: servingQuantity,
      unit: servingUnit,
      source: "open_food_facts",
    };
  }

  return basisUnit
    ? { description: `100 ${basisUnit}`, quantity: 100, unit: basisUnit, source: "fallback_100" }
    : null;
};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const normalizeOpenFoodFactsProduct = (
  raw: Record<string, any>,
  requestedBarcode: string
): NormalizedOpenFoodFactsProduct => {
  const canonicalBarcode = trimOrNull(raw.code) ?? requestedBarcode;
  const packageUnit = unitOrNull(raw.product_quantity_unit);
  const servingUnit = unitOrNull(raw.serving_quantity_unit);
  const basisUnit = servingUnit ?? packageUnit;
  const serving = determineServing(raw, basisUnit);
  const nutriments = raw.nutriments && typeof raw.nutriments === "object" ? raw.nutriments : {};
  const per100 = getNutrition(nutriments, "100g");
  const providerServing = getNutrition(nutriments, "serving");
  const perServing = calculateServingNutrition(per100, providerServing, serving?.quantity ?? null);
  const missingFields = (["calories", "protein", "carbohydrates", "fat"] as const)
    .filter((key) => per100[key] === null)
    .map((key) => `nutrition.per100.${key}`);

  const providerData: FoodCatalogProviderData = {
    identifiers: {
      barcode: canonicalBarcode,
      barcodeAliases: canonicalBarcode === requestedBarcode ? [] : [requestedBarcode],
      providerId: canonicalBarcode,
    },
    names: {
      he: trimOrNull(raw.product_name_he),
      en: trimOrNull(raw.product_name_en),
      original: trimOrNull(raw.product_name),
      originalLanguage: trimOrNull(raw.lang),
    },
    brand: trimOrNull(raw.brands),
    imageUrl: trimOrNull(raw.image_front_url),
    package: {
      description: trimOrNull(raw.quantity),
      quantity: positiveNumberOrNull(raw.product_quantity),
      unit: packageUnit,
    },
    serving,
    nutrition: { basisUnit, per100, perServing },
    dataQuality: {
      status: missingFields.length === 0 ? "complete" : "partial",
      missingFields,
      errors: stringArray(raw.data_quality_errors_tags),
      warnings: stringArray(raw.data_quality_warnings_tags),
    },
  };

  const normalizedDataHash = createHash("sha256")
    .update(JSON.stringify(providerData))
    .digest("hex");
  const modifiedSeconds = positiveNumberOrNull(raw.last_modified_t);

  return {
    providerData,
    schemaVersion:
      typeof raw.schema_version === "number" && Number.isInteger(raw.schema_version)
        ? raw.schema_version
        : null,
    sourceLastModifiedAt: modifiedSeconds ? new Date(modifiedSeconds * 1000) : null,
    normalizedDataHash,
  };
};
