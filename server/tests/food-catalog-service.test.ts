import { Types } from "mongoose";
import {
  applyAdminOverridePatch,
  mergeFoodCatalogData,
} from "../src/services/foodCatalog/mergeFoodCatalogData";
import { FoodCatalogService } from "../src/services/foodCatalogService";

const now = new Date("2026-08-13T12:00:00.000Z");
const nutrition = {
  calories: 100,
  protein: 10,
  carbohydrates: 20,
  fat: 5,
  saturatedFat: null,
  sugars: null,
  fiber: null,
  sodium: null,
  salt: null,
};
const providerData: any = {
  identifiers: { barcode: "12345678", barcodeAliases: [], providerId: "12345678" },
  names: { he: "מקור", en: "Original", original: "Original", originalLanguage: "en" },
  brand: "Brand",
  imageUrl: null,
  package: { description: null, quantity: null, unit: null },
  serving: { description: "100 g", quantity: 100, unit: "g", source: "fallback_100" },
  nutrition: { basisUnit: "g", per100: nutrition, perServing: nutrition },
  dataQuality: { status: "complete", missingFields: [], errors: [], warnings: [] },
};

const item = (nextRefreshAt: Date): any => ({
  _id: new Types.ObjectId("64b000000000000000000001"),
  providerData,
  adminOverrides: null,
  source: { normalizedDataHash: "old", nextRefreshAt },
  analytics: { lookupCount: 1, consumptionCount: 0 },
});

describe("food catalog Admin overlays", () => {
  test("merges only overridden leaves and keeps provider siblings", () => {
    const effective = mergeFoodCatalogData(providerData, {
      names: { he: "תיקון" },
      nutrition: { per100: { calories: 90 } },
      updatedAt: now,
      updatedBy: new Types.ObjectId(),
    });

    expect(effective.names).toMatchObject({ he: "תיקון", en: "Original" });
    expect(effective.nutrition.per100).toMatchObject({ calories: 90, protein: 10 });
  });

  test("null patch leaves clear an existing override and restore provider fallback", () => {
    const patched = applyAdminOverridePatch(
      { names: { he: "תיקון", en: "Correction" } } as any,
      { names: { he: null } },
      new Types.ObjectId(),
      now
    );

    expect(patched?.names).toEqual({ en: "Correction" });
    expect(mergeFoodCatalogData(providerData, patched as any).names.he).toBe("מקור");
  });
});

describe("FoodCatalogService", () => {
  const setup = () => {
    const repository: any = {
      findByBarcode: jest.fn(),
      incrementLookup: jest.fn(),
      upsertProviderProduct: jest.fn(),
      tryAcquireRefreshLease: jest.fn(),
      completeRefresh: jest.fn(),
      failRefresh: jest.fn(),
      incrementConsumption: jest.fn(),
      findByItemId: jest.fn(),
      setAdminOverrides: jest.fn(),
      clearAdminOverrides: jest.fn(),
    };
    const negativeCache: any = {
      findActive: jest.fn().mockResolvedValue(null),
      remember: jest.fn(),
      clear: jest.fn(),
    };
    const provider: any = { getProduct: jest.fn() };
    const normalizer = jest.fn().mockReturnValue({
      providerData,
      schemaVersion: 1004,
      sourceLastModifiedAt: null,
      normalizedDataHash: "new",
    });
    const service = new FoodCatalogService(repository, negativeCache, provider, normalizer);
    return { service, repository, negativeCache, provider, normalizer };
  };

  test("returns and counts a fresh cached item without calling the provider", async () => {
    const { service, repository, provider } = setup();
    const cached = item(new Date("2026-09-01T00:00:00.000Z"));
    repository.findByBarcode.mockResolvedValue(cached);
    repository.incrementLookup.mockResolvedValue({ ...cached, analytics: { lookupCount: 2 } });

    const result = await service.lookupBarcode("12345678", now);

    expect(result.cache.status).toBe("hit");
    expect(result.product.displayName).toBe("מקור");
    expect(result.product.analytics.lookupCount).toBe(2);
    expect(provider.getProduct).not.toHaveBeenCalled();
  });

  test("creates and returns a normalized item on a cache miss", async () => {
    const { service, repository, provider } = setup();
    repository.findByBarcode.mockResolvedValue(null);
    provider.getProduct.mockResolvedValue({ status: "found", product: { code: "12345678" } });
    repository.upsertProviderProduct.mockResolvedValue(item(new Date("2026-09-12")));

    const result = await service.lookupBarcode("12345678", now);

    expect(result.cache.status).toBe("created");
    expect(result.product.nutrition.per100.calories).toBe(100);
  });

  test("returns cached effective data when a stale refresh fails", async () => {
    const { service, repository, provider } = setup();
    const cached = item(new Date("2026-08-01"));
    repository.findByBarcode.mockResolvedValue(cached);
    repository.tryAcquireRefreshLease.mockResolvedValue(cached);
    provider.getProduct.mockRejectedValue(new Error("offline"));
    repository.failRefresh.mockResolvedValue({ ...cached, analytics: { lookupCount: 2 } });

    const result = await service.lookupBarcode("12345678", now);

    expect(result.cache.status).toBe("stale_fallback");
    expect(result.product.displayName).toBe("מקור");
  });

  test("returns cached data immediately when another request owns the refresh lease", async () => {
    const { service, repository, provider } = setup();
    const cached = item(new Date("2026-08-01"));
    repository.findByBarcode.mockResolvedValue(cached);
    repository.tryAcquireRefreshLease.mockResolvedValue(null);
    repository.incrementLookup.mockResolvedValue({ ...cached, analytics: { lookupCount: 2 } });

    const result = await service.lookupBarcode("12345678", now);

    expect(result.cache.status).toBe("hit");
    expect(provider.getProduct).not.toHaveBeenCalled();
  });
});
