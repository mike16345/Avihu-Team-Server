import mongoose from "mongoose";
import { FoodCatalogItemModel } from "../../src/models/foodCatalogItemModel";

const providerData = {
  identifiers: { barcode: "7290001234567", barcodeAliases: [], providerId: "7290001234567" },
  names: { he: "מוצר", en: "Product", original: "Product", originalLanguage: "en" },
  brand: null,
  imageUrl: null,
  package: { description: null, quantity: null, unit: null },
  serving: { description: "100 g", quantity: 100, unit: "g", source: "fallback_100" },
  nutrition: {
    basisUnit: "g",
    per100: {
      calories: 100,
      protein: 0,
      carbohydrates: null,
      fat: 1,
      saturatedFat: null,
      sugars: null,
      fiber: null,
      sodium: null,
      salt: null,
    },
    perServing: {
      calories: 100,
      protein: 0,
      carbohydrates: null,
      fat: 1,
      saturatedFat: null,
      sugars: null,
      fiber: null,
      sodium: null,
      salt: null,
    },
  },
  dataQuality: {
    status: "partial",
    missingFields: ["nutrition.per100.carbohydrates"],
    errors: [],
    warnings: [],
  },
};

const validDocument = () => ({
  providerData,
  adminOverrides: null,
  search: { normalizedNames: ["product", "מוצר"], normalizedBrand: null, aliases: [] },
  source: {
    provider: "open_food_facts",
    providerId: "7290001234567",
    license: "ODbL-1.0",
    sourceUrl: "https://world.openfoodfacts.org/product/7290001234567",
    schemaVersion: 1004,
    sourceLastModifiedAt: null,
    normalizedDataHash: "a".repeat(64),
    lastFetchAttemptAt: new Date(),
    lastSuccessfulFetchAt: new Date(),
    nextRefreshAt: new Date(),
    consecutiveFailures: 0,
    refreshLeaseUntil: null,
  },
});

describe("FoodCatalogItemModel", () => {
  test("accepts partial nutrition and preserves explicit zeroes", async () => {
    const saved = await FoodCatalogItemModel.create(validDocument());

    expect(saved.providerData.nutrition.per100.protein).toBe(0);
    expect(saved.providerData.nutrition.per100.carbohydrates).toBeNull();
    expect(saved.analytics).toMatchObject({ lookupCount: 0, consumptionCount: 0 });
    expect(saved.source).toMatchObject({
      license: "ODbL-1.0",
      sourceUrl: "https://world.openfoodfacts.org/product/7290001234567",
    });
    expect((saved as any).trainerId).toBeUndefined();
  });

  test("rejects negative nutrition and analytics", async () => {
    const invalid = validDocument();
    invalid.providerData.nutrition.per100.fat = -1;

    await expect(
      FoodCatalogItemModel.create({
        ...invalid,
        analytics: { lookupCount: -1, consumptionCount: 0 },
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test("rejects unknown document fields", async () => {
    expect(
      () => new FoodCatalogItemModel({ ...validDocument(), trainerId: "not-allowed" })
    ).toThrow(mongoose.Error.StrictModeError);
  });
});
