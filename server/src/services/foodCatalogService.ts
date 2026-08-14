import { Types } from "mongoose";
import { OpenFoodFactsProvider } from "../providers/OpenFoodFactsProvider";
import { FoodCatalogRepository } from "../repositories/FoodCatalog/FoodCatalogRepository";
import { FoodCatalogLookupCacheRepository } from "../repositories/FoodCatalog/FoodCatalogLookupCacheRepository";
import { normalizeOpenFoodFactsProduct } from "./foodCatalog/OpenFoodFactsNormalizer";
import { applyAdminOverridePatch, mergeFoodCatalogData } from "./foodCatalog/mergeFoodCatalogData";

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 30 * DAY_MS;
const LEASE_MS = 30 * 1000;
const TRANSIENT_BACKOFF_MS = 5 * 60 * 1000;
const NOT_FOUND_BACKOFF_MS = DAY_MS;

type CacheStatus = "created" | "hit" | "refreshed" | "stale_fallback";

export class FoodCatalogService {
  constructor(
    private readonly repository = new FoodCatalogRepository(),
    private readonly negativeCache = new FoodCatalogLookupCacheRepository(),
    private readonly provider = new OpenFoodFactsProvider(),
    private readonly normalizer = normalizeOpenFoodFactsProduct
  ) {}

  private response(item: any, status: CacheStatus) {
    const effective = mergeFoodCatalogData(item.providerData, item.adminOverrides);
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
        analytics: item.analytics,
      },
      cache: { status },
    };
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
        return this.response(unchanged ?? cached, "hit");
      }
      const refreshed = await this.repository.completeRefresh(
        cached._id.toString(),
        normalized,
        now,
        nextRefreshAt
      );
      return this.response(refreshed ?? cached, "refreshed");
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
    return this.response(updated, "hit").product;
  }

  async clearAdminOverrides(itemId: string) {
    const item = await this.repository.clearAdminOverrides(itemId);
    if (!item) throw { status: 404, message: "Food catalog item was not found." };
    return this.response(item, "hit").product;
  }
}
