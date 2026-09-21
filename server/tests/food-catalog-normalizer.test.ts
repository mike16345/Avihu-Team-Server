import { normalizeOpenFoodFactsProduct } from "../src/services/foodCatalog/OpenFoodFactsNormalizer";

describe("OpenFoodFactsNormalizer", () => {
  test("normalizes localized names, serving, extended nutrition, and explicit zeroes", () => {
    const result = normalizeOpenFoodFactsProduct(
      {
        code: "7290001234567",
        schema_version: 1004,
        lang: "he",
        product_name: "  מוצר מקורי  ",
        product_name_he: "  יוגורט יווני  ",
        product_name_en: " Greek Yogurt ",
        brands: " Example ",
        image_front_url: " https://example.test/front.jpg ",
        quantity: "4 x 30 g",
        product_quantity: "120",
        product_quantity_unit: "g",
        serving_size: "1 cup (30 g)",
        serving_quantity: "30",
        serving_quantity_unit: "g",
        nutriments: {
          "energy-kcal_100g": 100,
          proteins_100g: 10,
          carbohydrates_100g: 12,
          fat_100g: 5,
          "saturated-fat_100g": 2,
          sugars_100g: 3,
          fiber_100g: 0,
          sodium_100g: 0.2,
          salt_100g: 0.5,
        },
        data_quality_errors_tags: ["en:test-error"],
        data_quality_warnings_tags: ["en:test-warning"],
      },
      "7290001234567"
    );

    expect(result.providerData.names).toEqual({
      he: "יוגורט יווני",
      en: "Greek Yogurt",
      original: "מוצר מקורי",
      originalLanguage: "he",
    });
    expect(result.providerData.serving).toEqual({
      description: "1 cup (30 g)",
      quantity: 30,
      unit: "g",
      source: "open_food_facts",
    });
    expect(result.providerData.servings).toEqual([
      {
        id: "off-serving",
        description: "1 cup (30 g)",
        quantity: 30,
        unit: "g",
        nutrition: expect.objectContaining({ calories: 30, protein: 3 }),
        source: "open_food_facts",
      },
      {
        id: "off-100-g",
        description: "100 g",
        quantity: 100,
        unit: "g",
        nutrition: expect.objectContaining({ calories: 100, protein: 10 }),
        source: "fallback_100",
      },
    ]);
    expect(result.providerData.nutrition.per100).toEqual({
      calories: 100,
      protein: 10,
      carbohydrates: 12,
      fat: 5,
      saturatedFat: 2,
      sugars: 3,
      fiber: 0,
      sodium: 0.2,
      salt: 0.5,
    });
    expect(result.providerData.nutrition.perServing).toEqual({
      calories: 30,
      protein: 3,
      carbohydrates: 3.6,
      fat: 1.5,
      saturatedFat: 0.6,
      sugars: 0.9,
      fiber: 0,
      sodium: 0.06,
      salt: 0.15,
    });
    expect(result.providerData.dataQuality).toMatchObject({
      status: "complete",
      missingFields: [],
      errors: ["en:test-error"],
      warnings: ["en:test-warning"],
    });
  });

  test("returns partial data and uses a marked 100 ml fallback without inventing nutrients", () => {
    const result = normalizeOpenFoodFactsProduct(
      {
        code: "012345678905",
        product_name_en: "Drink",
        product_quantity_unit: "ml",
        nutriments: {
          "energy-kj_100g": 418.4,
          proteins_100g: -1,
          carbohydrates_100g: "invalid",
          fat_100g: 0,
        },
      },
      "012345678905"
    );

    expect(result.providerData.serving).toEqual({
      description: "100 ml",
      quantity: 100,
      unit: "ml",
      source: "fallback_100",
    });
    expect(result.providerData.nutrition.per100).toMatchObject({
      calories: 100,
      protein: null,
      carbohydrates: null,
      fat: 0,
    });
    expect(result.providerData.nutrition.perServing).toEqual(result.providerData.nutrition.per100);
    expect(result.providerData.servings).toEqual([
      expect.objectContaining({
        id: "off-100-ml",
        description: "100 ml",
        quantity: 100,
        unit: "ml",
        nutrition: result.providerData.nutrition.per100,
      }),
    ]);
    expect(result.providerData.dataQuality.status).toBe("partial");
    expect(result.providerData.dataQuality.missingFields).toEqual([
      "nutrition.per100.protein",
      "nutrition.per100.carbohydrates",
    ]);
  });

  test("produces the same content hash for equivalent normalized provider data", () => {
    const first = normalizeOpenFoodFactsProduct(
      { product_name_en: "Food", nutriments: { proteins_100g: 2 } },
      "12345678"
    );
    const second = normalizeOpenFoodFactsProduct(
      { nutriments: { proteins_100g: 2 }, product_name_en: " Food " },
      "12345678"
    );

    expect(first.normalizedDataHash).toBe(second.normalizedDataHash);
  });
});
