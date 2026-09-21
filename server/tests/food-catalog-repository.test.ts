import { FoodCatalogRepository } from "../src/repositories/FoodCatalog/FoodCatalogRepository";
import { normalizeOpenFoodFactsProduct } from "../src/services/foodCatalog/OpenFoodFactsNormalizer";

describe("FoodCatalogRepository", () => {
  test("atomically upserts a barcode and increments lookup analytics", async () => {
    const repository = new FoodCatalogRepository();
    const now = new Date("2026-08-13T12:00:00.000Z");
    const normalized = normalizeOpenFoodFactsProduct(
      { code: "12345678", product_name_en: "Food", nutriments: { fat_100g: 0 } },
      "12345678"
    );

    const first = await repository.upsertProviderProduct(
      normalized,
      "12345678",
      now,
      new Date("2026-09-12T12:00:00.000Z")
    );
    const second = await repository.upsertProviderProduct(
      normalized,
      "12345678",
      now,
      new Date("2026-09-12T12:00:00.000Z")
    );

    expect(second._id.toString()).toBe(first._id.toString());
    expect(second.analytics.lookupCount).toBe(2);
    expect(second.analytics.consumptionCount).toBe(0);
    expect(second.source).toMatchObject({
      provider: "open_food_facts",
      license: "ODbL-1.0",
      sourceUrl: "https://world.openfoodfacts.org/product/12345678",
    });
  });

  test("allows only one concurrent owner to acquire an active refresh lease", async () => {
    const repository = new FoodCatalogRepository();
    const now = new Date("2026-08-13T12:00:00.000Z");
    const normalized = normalizeOpenFoodFactsProduct(
      { code: "123456789012", product_name_en: "Food" },
      "123456789012"
    );
    const saved = await repository.upsertProviderProduct(
      normalized,
      "123456789012",
      now,
      new Date("2026-08-01T00:00:00.000Z")
    );

    const first = await repository.tryAcquireRefreshLease(
      saved._id.toString(),
      now,
      new Date(now.getTime() + 30_000)
    );
    const second = await repository.tryAcquireRefreshLease(
      saved._id.toString(),
      now,
      new Date(now.getTime() + 30_000)
    );

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  test("finds word prefixes and ranks the empty catalog by consumption", async () => {
    const repository = new FoodCatalogRepository();
    const now = new Date("2026-08-13T12:00:00.000Z");
    const chicken = normalizeOpenFoodFactsProduct(
      {
        code: "7290000000001",
        product_name_en: "Chicken Breast",
        product_name_he: "חזה עוף",
        brands: "Example",
      },
      "7290000000001"
    );
    const yogurt = normalizeOpenFoodFactsProduct(
      { code: "7290000000002", product_name_en: "Greek Yogurt" },
      "7290000000002"
    );
    const chickenItem = await repository.upsertProviderProduct(
      chicken,
      "7290000000001",
      now,
      new Date("2026-09-12T12:00:00.000Z")
    );
    await repository.upsertProviderProduct(
      yogurt,
      "7290000000002",
      now,
      new Date("2026-09-12T12:00:00.000Z")
    );
    await repository.incrementConsumption(chickenItem._id.toString(), now);

    const matches = await repository.searchCatalog("chic bre", 10);
    const popular = await repository.searchCatalog("", 1);
    const languageCodeMatches = await repository.searchCatalog("en", 10);

    expect(matches.map((item: any) => item.providerData.names.en)).toEqual(["Chicken Breast"]);
    expect(popular[0].providerData.names.en).toBe("Chicken Breast");
    expect(languageCodeMatches).toHaveLength(0);
  });
});
