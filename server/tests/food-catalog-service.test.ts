import { Types } from "mongoose";
import {
  applyAdminOverridePatch,
  mergeFoodCatalogData,
} from "../src/services/foodCatalog/mergeFoodCatalogData";
import { FoodCatalogService } from "../src/services/foodCatalogService";
import { buildFoodCatalogSearchFields } from "../src/utils/foodCatalogSearch";

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
  source: {
    provider: "open_food_facts",
    providerId: "12345678",
    normalizedDataHash: "old",
    nextRefreshAt,
  },
  analytics: { lookupCount: 1, consumptionCount: 0 },
});

describe("food catalog Admin overlays", () => {
  test("does not index the original language code as a product name", () => {
    expect(buildFoodCatalogSearchFields(providerData).normalizedNames).not.toContain("en");
  });

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
      searchCatalog: jest.fn(),
      setAdminOverrides: jest.fn(),
      clearAdminOverrides: jest.fn(),
      findMissingSearchItems: jest.fn().mockResolvedValue([]),
      bulkUpdateSearchFields: jest.fn(),
      updateSearchFields: jest.fn(),
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
    expect(result.product.provenance).toEqual({
      provider: "open_food_facts",
      license: "ODbL-1.0",
      sourceUrl: "https://world.openfoodfacts.org/product/12345678",
    });
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

  test("keeps Admin override names searchable after a provider refresh", async () => {
    const { service, repository, provider } = setup();
    const cached = {
      ...item(new Date("2026-08-01")),
      adminOverrides: {
        names: { he: "שם מתוקן" },
        updatedAt: now,
        updatedBy: new Types.ObjectId(),
      },
    };
    repository.findByBarcode.mockResolvedValue(cached);
    repository.tryAcquireRefreshLease.mockResolvedValue(cached);
    provider.getProduct.mockResolvedValue({ status: "found", product: { code: "12345678" } });
    repository.completeRefresh.mockResolvedValue(cached);
    repository.updateSearchFields.mockResolvedValue(cached);

    await service.lookupBarcode("12345678", now);

    const search = repository.updateSearchFields.mock.calls[0][1];
    expect(search.normalizedNames).toEqual(expect.arrayContaining(["מקור", "שם מתוקן"]));
    expect(search.prefixes).toContain("מתוקן");
  });

  test("retries search indexing when an Admin override changes during refresh", async () => {
    const { service, repository, provider } = setup();
    const cached = item(new Date("2026-08-01"));
    const latest = {
      ...cached,
      adminOverrides: {
        names: { he: "השם החדש" },
        updatedAt: new Date("2026-08-13T12:00:01.000Z"),
        updatedBy: new Types.ObjectId(),
      },
      source: { ...cached.source, normalizedDataHash: "new" },
    };
    repository.findByBarcode.mockResolvedValue(cached);
    repository.tryAcquireRefreshLease.mockResolvedValue(cached);
    provider.getProduct.mockResolvedValue({ status: "found", product: { code: "12345678" } });
    repository.completeRefresh.mockResolvedValue({
      ...cached,
      source: { ...cached.source, normalizedDataHash: "new" },
    });
    repository.updateSearchFields.mockResolvedValueOnce(null).mockResolvedValueOnce(latest);
    repository.findByItemId.mockResolvedValue(latest);

    await service.lookupBarcode("12345678", now);

    expect(repository.updateSearchFields).toHaveBeenCalledTimes(2);
    expect(repository.updateSearchFields.mock.calls[1][1].prefixes).toContain("החדש");
  });

  test("returns effective overridden products from local catalog search", async () => {
    const { service, repository, provider } = setup();
    repository.searchCatalog.mockResolvedValue([
      {
        ...item(new Date("2026-09-01")),
        adminOverrides: {
          names: { he: "שם מתוקן" },
          updatedAt: now,
          updatedBy: new Types.ObjectId(),
        },
      },
    ]);

    const result = await service.search("שם");

    expect(repository.searchCatalog).toHaveBeenCalledWith("שם", 10);
    expect(result.products[0].displayName).toBe("שם מתוקן");
    expect(provider.getProduct).not.toHaveBeenCalled();
  });

  test("rebuilds searchable prefixes when an Admin overrides a product name", async () => {
    const { service, repository } = setup();
    const current = item(new Date("2026-09-01"));
    repository.findByItemId.mockResolvedValue(current);
    repository.setAdminOverrides.mockImplementation(async (_id: string, overrides: any) => ({
      ...current,
      adminOverrides: overrides,
    }));
    repository.updateSearchFields.mockImplementation(async (_id: string, search: any) => ({
      ...current,
      adminOverrides: {
        names: { he: "שם מתוקן" },
        updatedAt: now,
        updatedBy: new Types.ObjectId(),
      },
      search,
    }));

    await service.applyAdminOverrides(
      current._id.toString(),
      { names: { he: "שם מתוקן" } },
      new Types.ObjectId().toString()
    );

    const search = repository.updateSearchFields.mock.calls[0][1];
    expect(search.normalizedNames).toEqual(expect.arrayContaining(["מקור", "שם מתוקן"]));
    expect(search.prefixes).toEqual(expect.arrayContaining(["שם", "מתו", "מתוקן"]));
  });

  test("owns popular and textual result counts on the server", async () => {
    const { service, repository } = setup();
    repository.searchCatalog.mockResolvedValue([]);

    await service.search("");
    await service.search("chicken");

    expect(repository.searchCatalog.mock.calls).toEqual([
      ["", 6],
      ["chicken", 10],
    ]);
  });

  test("backfills normalized search fields for legacy catalog items", async () => {
    const { service, repository } = setup();
    const legacy = {
      ...item(new Date("2026-09-01")),
      adminOverrides: {
        names: { he: "שם מתוקן" },
        updatedAt: now,
        updatedBy: new Types.ObjectId(),
      },
    };
    repository.findMissingSearchItems.mockResolvedValue([legacy]);
    repository.searchCatalog.mockResolvedValue([]);

    await service.search("");

    expect(repository.bulkUpdateSearchFields).toHaveBeenCalledWith([
      expect.objectContaining({
        itemId: legacy._id.toString(),
        search: expect.objectContaining({ prefixes: expect.arrayContaining(["מתוקן"]) }),
        adminOverridesUpdatedAt: now,
        normalizedDataHash: "old",
      }),
    ]);
  });

  test("rebuilds search fields even when provider nutrition is unchanged", async () => {
    const { service, repository, provider, normalizer } = setup();
    const cached = {
      ...item(new Date("2026-08-01")),
      adminOverrides: {
        names: { he: "שם מתוקן" },
        updatedAt: now,
        updatedBy: new Types.ObjectId(),
      },
    };
    repository.findByBarcode.mockResolvedValue(cached);
    repository.tryAcquireRefreshLease.mockResolvedValue(cached);
    provider.getProduct.mockResolvedValue({ status: "found", product: { code: "12345678" } });
    normalizer.mockReturnValue({
      providerData,
      schemaVersion: 1004,
      sourceLastModifiedAt: null,
      normalizedDataHash: "old",
    });
    repository.markRefreshUnchanged = jest.fn().mockResolvedValue(cached);
    repository.updateSearchFields.mockResolvedValue(cached);

    await service.lookupBarcode("12345678", now);

    expect(repository.updateSearchFields.mock.calls[0][1].prefixes).toContain("מתוקן");
  });
});
