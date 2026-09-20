import { createHash } from "crypto";
import { Types } from "mongoose";
import { OpenFoodFactsProvider } from "../providers/OpenFoodFactsProvider";
import { FoodCatalogRepository } from "../repositories/FoodCatalog/FoodCatalogRepository";
import { FoodCatalogLookupCacheRepository } from "../repositories/FoodCatalog/FoodCatalogLookupCacheRepository";
import { normalizeOpenFoodFactsProduct } from "./foodCatalog/OpenFoodFactsNormalizer";
import { applyAdminOverridePatch, mergeFoodCatalogData } from "./foodCatalog/mergeFoodCatalogData";
import { buildFoodCatalogSearchFields } from "../utils/foodCatalogSearch";
import {
  buildFoodCatalogProvenance,
  type FoodCatalogProvider,
} from "../utils/foodCatalogProvenance";
import {
  FoodCatalogProviderData,
  FoodServingOption,
  ManualFoodCatalogInput,
  NutritionValues,
} from "../interfaces/IFoodCatalogItem";
import { StatusCode } from "../enums/StatusCode";

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 30 * DAY_MS;
const LEASE_MS = 30 * 1000;
const TRANSIENT_BACKOFF_MS = 5 * 60 * 1000;
const NOT_FOUND_BACKOFF_MS = DAY_MS;

type CacheStatus = "created" | "hit" | "refreshed" | "stale_fallback";

const EMPTY_NUTRITION: NutritionValues = {
  calories: null,
  protein: null,
  carbohydrates: null,
  fat: null,
  saturatedFat: null,
  sugars: null,
  fiber: null,
  sodium: null,
  salt: null,
};

const normalizeManualNutrition = (nutrition: NutritionValues): NutritionValues =>
  Object.fromEntries(
    Object.keys(EMPTY_NUTRITION).map((field) => [
      field,
      nutrition[field as keyof NutritionValues] ?? null,
    ])
  ) as unknown as NutritionValues;

export class FoodCatalogService {
  private legacySearchBackfillComplete = false;

  constructor(
    private readonly repository = new FoodCatalogRepository(),
    private readonly negativeCache = new FoodCatalogLookupCacheRepository(),
    private readonly provider = new OpenFoodFactsProvider(),
    private readonly normalizer = normalizeOpenFoodFactsProduct
  ) {}

  lookupItem = async (itemId: string, _now = new Date()) => {
    const item = await this.repository.findByItemId(itemId);
    if (!item) {
      throw { status: StatusCode.NOT_FOUND, message: "Food catalog item not found." };
    }

    return this.response(item, "hit");
  };

  private response(item: any, status: CacheStatus) {
    const effective = mergeFoodCatalogData(item.providerData, item.adminOverrides);
    if (!Array.isArray(effective.servings) || effective.servings.length === 0) {
      effective.servings = effective.serving
        ? [
            {
              id: "legacy-serving",
              description: effective.serving.description,
              quantity: effective.serving.quantity,
              unit: effective.serving.unit,
              nutrition: effective.nutrition.perServing,
              source: effective.serving.source,
            },
          ]
        : [];
    }
    const provider = (item.source?.provider ?? "open_food_facts") as FoodCatalogProvider;
    const derivedProvenance = buildFoodCatalogProvenance(
      provider,
      item.source?.providerId ?? item.providerData.identifiers.barcode
    );
    const displayName =
      effective.names.he ?? effective.names.en ?? effective.names.original ?? null;
    return {
      product: {
        id: item._id.toString(),
        ...effective,
        displayName,
        displayLanguage: effective.names.he
          ? "he"
          : effective.names.en
            ? "en"
            : effective.names.original
              ? "original"
              : null,
        hasAdminOverrides: Boolean(item.adminOverrides),
        provenance: {
          provider,
          license: item.source?.license ?? derivedProvenance.license,
          sourceUrl: item.source?.sourceUrl ?? derivedProvenance.sourceUrl,
        },
        analytics: item.analytics,
      },
      cache: { status },
    };
  }

  private async rebuildSearchFields(item: any): Promise<any> {
    let current = item;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const effective = mergeFoodCatalogData(current.providerData, current.adminOverrides);
      const search = buildFoodCatalogSearchFields(current.providerData, effective);
      const updated = await this.repository.updateSearchFields(
        current._id.toString(),
        search,
        current.adminOverrides?.updatedAt ?? null,
        current.source.normalizedDataHash
      );
      if (updated) return updated;
      current = await this.repository.findByItemId(current._id.toString());
      if (!current) return item;
    }
    return current;
  }

  private async backfillLegacySearchFields(): Promise<void> {
    if (this.legacySearchBackfillComplete) return;
    const batchSize = 200;
    const items = await this.repository.findMissingSearchItems(batchSize);
    if (items.length) {
      await this.repository.bulkUpdateSearchFields(
        items.map((item: any) => ({
          itemId: item._id.toString(),
          search: buildFoodCatalogSearchFields(
            item.providerData,
            mergeFoodCatalogData(item.providerData, item.adminOverrides)
          ),
          adminOverridesUpdatedAt: item.adminOverrides?.updatedAt ?? null,
          normalizedDataHash: item.source.normalizedDataHash,
        }))
      );
    }
    this.legacySearchBackfillComplete = items.length < batchSize;
  }

  async lookupBarcode(barcodeInput: string, now = new Date()) {
    const barcode = barcodeInput.trim();
    const cached = await this.repository.findByBarcode(barcode);

    if (cached && cached.source.nextRefreshAt && cached.source.nextRefreshAt > now) {
      const counted = await this.repository.incrementLookup(cached._id.toString(), now);
      return this.response(counted ?? cached, "hit");
    }

    if (cached) return this.refreshCached(cached, barcode, now);

    const negative = await this.negativeCache.findActive(barcode, now);
    if (negative?.status === "not_found") throw { status: 404, message: "Food was not found." };
    if (negative) throw { status: 503, message: "Food provider is temporarily unavailable." };

    try {
      const lookup = await this.provider.getProduct(barcode);
      if (lookup.status === "not_found") {
        await this.negativeCache.remember(
          barcode,
          "not_found",
          new Date(now.getTime() + NOT_FOUND_BACKOFF_MS)
        );
        throw { status: 404, message: "Food was not found." };
      }
      const normalized = this.normalizer(lookup.product, barcode);
      const saved = await this.repository.upsertProviderProduct(
        normalized,
        barcode,
        now,
        new Date(now.getTime() + REFRESH_MS)
      );
      await this.negativeCache.clear(barcode);
      return this.response(saved, "created");
    } catch (error: any) {
      if (error?.status === 404) throw error;
      await this.negativeCache.remember(
        barcode,
        "provider_error",
        new Date(now.getTime() + TRANSIENT_BACKOFF_MS)
      );
      throw { status: 503, message: "Food provider is temporarily unavailable." };
    }
  }

  private async refreshCached(cached: any, barcode: string, now: Date) {
    const leased = await this.repository.tryAcquireRefreshLease(
      cached._id.toString(),
      now,
      new Date(now.getTime() + LEASE_MS)
    );
    if (!leased) {
      const counted = await this.repository.incrementLookup(cached._id.toString(), now);
      return this.response(counted ?? cached, "hit");
    }

    try {
      const lookup = await this.provider.getProduct(barcode);
      if (lookup.status === "not_found") throw new Error("Provider no longer has cached product");
      const normalized = this.normalizer(lookup.product, barcode);
      const nextRefreshAt = new Date(now.getTime() + REFRESH_MS);
      if (normalized.normalizedDataHash === cached.source.normalizedDataHash) {
        const unchanged = await this.repository.markRefreshUnchanged(
          cached._id.toString(),
          now,
          nextRefreshAt
        );
        const searchable = await this.rebuildSearchFields(unchanged ?? cached);
        return this.response(searchable, "hit");
      }
      const refreshed = await this.repository.completeRefresh(
        cached._id.toString(),
        normalized,
        now,
        nextRefreshAt
      );
      const searchable = await this.rebuildSearchFields(refreshed ?? cached);
      return this.response(searchable, "refreshed");
    } catch (_error) {
      const fallback = await this.repository.failRefresh(
        cached._id.toString(),
        now,
        new Date(now.getTime() + TRANSIENT_BACKOFF_MS)
      );
      return this.response(fallback ?? cached, "stale_fallback");
    }
  }

  async reportConsumption(itemId: string, now = new Date()) {
    const item = await this.repository.incrementConsumption(itemId, now);
    if (!item) throw { status: 404, message: "Food catalog item was not found." };
    return { id: item._id.toString(), analytics: item.analytics };
  }

  async search(query: string) {
    await this.backfillLegacySearchFields();
    const normalizedQuery = query.trim();
    const items = await this.repository.searchCatalog(normalizedQuery, normalizedQuery ? 10 : 6);
    return { products: items.map((item) => this.response(item, "hit").product) };
  }

  async applyAdminOverrides(
    itemId: string,
    patch: Record<string, any>,
    adminId: string,
    reason?: string,
    now = new Date()
  ) {
    const item = await this.repository.findByItemId(itemId);
    if (!item) throw { status: 404, message: "Food catalog item was not found." };
    const overrides = applyAdminOverridePatch(
      item.adminOverrides,
      patch,
      new Types.ObjectId(adminId),
      now,
      reason
    );
    const updated = overrides
      ? await this.repository.setAdminOverrides(itemId, overrides)
      : await this.repository.clearAdminOverrides(itemId);
    if (!updated) throw { status: 404, message: "Food catalog item was not found." };
    const searchable = await this.rebuildSearchFields(updated);
    return this.response(searchable, "hit").product;
  }

  async clearAdminOverrides(itemId: string) {
    const current = await this.repository.findByItemId(itemId);
    if (!current) throw { status: 404, message: "Food catalog item was not found." };
    const item = await this.repository.clearAdminOverrides(itemId);
    if (!item) throw { status: 404, message: "Food catalog item was not found." };
    const searchable = await this.rebuildSearchFields(item);
    return this.response(searchable, "hit").product;
  }

  private buildManualProviderData(input: ManualFoodCatalogInput): FoodCatalogProviderData {
    const servings: FoodServingOption[] = input.servings.map((serving, index) => ({
      id: serving.id?.trim() || `admin-serving-${index + 1}`,
      description: serving.description.trim(),
      quantity: serving.quantity,
      unit: serving.unit.trim(),
      nutrition: normalizeManualNutrition(serving.nutrition as NutritionValues),
      source: "admin",
    }));
    const first = servings[0];
    const basisUnit = first?.unit === "g" || first?.unit === "ml" ? first.unit : null;
    const missingFields = (["calories", "protein", "carbohydrates", "fat"] as const)
      .filter((field) => first?.nutrition[field] === null)
      .map((field) => `servings.0.nutrition.${field}`);

    return {
      identifiers: { barcode: null, barcodeAliases: [], providerId: null },
      names: {
        he: input.names.he?.trim() || null,
        en: input.names.en?.trim() || null,
        original: input.names.original?.trim() || null,
        originalLanguage: input.names.originalLanguage?.trim() || null,
      },
      brand: input.brand?.trim() || null,
      imageUrl: null,
      package: { description: null, quantity: null, unit: null },
      serving:
        first && basisUnit
          ? {
              description: first.description,
              quantity: first.quantity,
              unit: basisUnit,
              source: "fallback_100",
            }
          : null,
      servings,
      nutrition: {
        basisUnit,
        per100: basisUnit && first.quantity === 100 ? first.nutrition : { ...EMPTY_NUTRITION },
        perServing: first?.nutrition ?? { ...EMPTY_NUTRITION },
      },
      dataQuality: {
        status: missingFields.length === 0 ? "complete" : "partial",
        missingFields,
        errors: [],
        warnings: [],
      },
    };
  }

  async createManualItem(input: ManualFoodCatalogInput) {
    const providerData = this.buildManualProviderData(input);
    const itemId = new Types.ObjectId();
    providerData.identifiers.providerId = itemId.toString();
    const hash = createHash("sha256").update(JSON.stringify(providerData)).digest("hex");
    const created = await this.repository.createManualItem(
      itemId,
      providerData,
      hash,
      input.aliases ?? []
    );
    return this.response(created, "created").product;
  }

  async updateAdminItem(itemId: string, input: ManualFoodCatalogInput, adminId: string) {
    const current = await this.repository.findByItemId(itemId);
    if (!current) throw { status: 404, message: "Food catalog item was not found." };

    if (current.source.provider !== "admin") {
      return this.applyAdminOverrides(
        itemId,
        {
          names: input.names,
          brand: input.brand ?? null,
          servings: input.servings.map((serving, index) => ({
            id: serving.id?.trim() || `admin-serving-${index + 1}`,
            description: serving.description.trim(),
            quantity: serving.quantity,
            unit: serving.unit.trim(),
            nutrition: normalizeManualNutrition(serving.nutrition as NutritionValues),
            source: "admin",
          })),
        },
        adminId,
        "Admin food catalog edit"
      );
    }

    const providerData = this.buildManualProviderData(input);
    providerData.identifiers.providerId = current.source.providerId ?? itemId;
    const hash = createHash("sha256").update(JSON.stringify(providerData)).digest("hex");
    const updated = await this.repository.replaceManualItem(
      itemId,
      providerData,
      hash,
      input.aliases ?? []
    );
    if (!updated) throw { status: 404, message: "Manual food catalog item was not found." };
    return this.response(updated, "hit").product;
  }
}
