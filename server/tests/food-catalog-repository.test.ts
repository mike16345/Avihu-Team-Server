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
});
