import { Types } from "mongoose";
import {
  FoodCatalogAdminOverrides,
  IFoodCatalogItem,
  NormalizedOpenFoodFactsProduct,
} from "../../interfaces/IFoodCatalogItem";
import { FoodCatalogItemModel } from "../../models/foodCatalogItemModel";
import { BaseRepository } from "../BaseRepository";

const normalizeSearchValue = (value: string | null): string | null =>
  value ? value.normalize("NFKC").trim().toLocaleLowerCase() : null;

const buildSearch = (normalized: NormalizedOpenFoodFactsProduct) => ({
  normalizedNames: Array.from(
    new Set(
      Object.values(normalized.providerData.names)
        .filter((value): value is string => typeof value === "string")
        .map((value) => normalizeSearchValue(value))
        .filter((value): value is string => value !== null)
    )
  ),
  normalizedBrand: normalizeSearchValue(normalized.providerData.brand),
  aliases: [],
});

export class FoodCatalogRepository extends BaseRepository<IFoodCatalogItem> {
  constructor() {
    super(FoodCatalogItemModel, { type: "global" });
  }

  async findByBarcode(barcode: string): Promise<any | null> {
    return FoodCatalogItemModel.findOne({
      $or: [
        { "providerData.identifiers.barcode": barcode },
        { "providerData.identifiers.barcodeAliases": barcode },
      ],
    }).lean();
  }

  async findByItemId(itemId: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    return FoodCatalogItemModel.findById(itemId).lean();
  }

  async incrementLookup(itemId: string, now: Date): Promise<any | null> {
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      { $inc: { "analytics.lookupCount": 1 }, $set: { "analytics.lastLookedUpAt": now } },
      { new: true }
    ).lean();
  }

  async incrementConsumption(itemId: string, now: Date): Promise<any | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      {
        $inc: { "analytics.consumptionCount": 1 },
        $set: { "analytics.lastConsumedAt": now },
      },
      { new: true }
    ).lean();
  }

  async upsertProviderProduct(
    normalized: NormalizedOpenFoodFactsProduct,
    requestedBarcode: string,
    now: Date,
    nextRefreshAt: Date
  ): Promise<any> {
    const canonicalBarcode = normalized.providerData.identifiers.barcode ?? requestedBarcode;
    const aliases = Array.from(
      new Set([...normalized.providerData.identifiers.barcodeAliases, requestedBarcode])
    ).filter((barcode) => barcode !== canonicalBarcode);

    return FoodCatalogItemModel.findOneAndUpdate(
      { "providerData.identifiers.barcode": canonicalBarcode },
      {
        $setOnInsert: {
          providerData: {
            ...normalized.providerData,
            identifiers: {
              ...normalized.providerData.identifiers,
              barcodeAliases: aliases,
            },
          },
          adminOverrides: null,
          search: buildSearch(normalized),
          source: {
            provider: "open_food_facts",
            providerId: normalized.providerData.identifiers.providerId,
            schemaVersion: normalized.schemaVersion,
            sourceLastModifiedAt: normalized.sourceLastModifiedAt,
            normalizedDataHash: normalized.normalizedDataHash,
            lastFetchAttemptAt: now,
            lastSuccessfulFetchAt: now,
            nextRefreshAt,
            consecutiveFailures: 0,
            refreshLeaseUntil: null,
          },
          "analytics.consumptionCount": 0,
          "analytics.lastConsumedAt": null,
        },
        $inc: { "analytics.lookupCount": 1 },
        $set: { "analytics.lastLookedUpAt": now },
      },
      { upsert: true, new: true, setDefaultsOnInsert: false }
    ).lean();
  }

  async tryAcquireRefreshLease(itemId: string, now: Date, leaseUntil: Date): Promise<any | null> {
    return FoodCatalogItemModel.findOneAndUpdate(
      {
        _id: itemId,
        $or: [
          { "source.refreshLeaseUntil": null },
          { "source.refreshLeaseUntil": { $exists: false } },
          { "source.refreshLeaseUntil": { $lte: now } },
        ],
      },
      { $set: { "source.refreshLeaseUntil": leaseUntil, "source.lastFetchAttemptAt": now } },
      { new: true }
    ).lean();
  }

  async completeRefresh(
    itemId: string,
    normalized: NormalizedOpenFoodFactsProduct,
    now: Date,
    nextRefreshAt: Date
  ): Promise<any | null> {
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      {
        $set: {
          providerData: normalized.providerData,
          search: buildSearch(normalized),
          "source.providerId": normalized.providerData.identifiers.providerId,
          "source.schemaVersion": normalized.schemaVersion,
          "source.sourceLastModifiedAt": normalized.sourceLastModifiedAt,
          "source.normalizedDataHash": normalized.normalizedDataHash,
          "source.lastFetchAttemptAt": now,
          "source.lastSuccessfulFetchAt": now,
          "source.nextRefreshAt": nextRefreshAt,
          "source.consecutiveFailures": 0,
          "source.refreshLeaseUntil": null,
          "analytics.lastLookedUpAt": now,
        },
        $inc: { "analytics.lookupCount": 1 },
      },
      { new: true }
    ).lean();
  }

  async markRefreshUnchanged(itemId: string, now: Date, nextRefreshAt: Date): Promise<any | null> {
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      {
        $set: {
          "source.lastFetchAttemptAt": now,
          "source.lastSuccessfulFetchAt": now,
          "source.nextRefreshAt": nextRefreshAt,
          "source.consecutiveFailures": 0,
          "source.refreshLeaseUntil": null,
          "analytics.lastLookedUpAt": now,
        },
        $inc: { "analytics.lookupCount": 1 },
      },
      { new: true }
    ).lean();
  }

  async failRefresh(itemId: string, now: Date, nextRefreshAt: Date): Promise<any | null> {
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      {
        $set: {
          "source.lastFetchAttemptAt": now,
          "source.nextRefreshAt": nextRefreshAt,
          "source.refreshLeaseUntil": null,
          "analytics.lastLookedUpAt": now,
        },
        $inc: { "source.consecutiveFailures": 1, "analytics.lookupCount": 1 },
      },
      { new: true }
    ).lean();
  }

  async setAdminOverrides(
    itemId: string,
    overrides: FoodCatalogAdminOverrides
  ): Promise<any | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      { $set: { adminOverrides: overrides } },
      { new: true, runValidators: true }
    ).lean();
  }

  async clearAdminOverrides(itemId: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      { $set: { adminOverrides: null } },
      { new: true }
    ).lean();
  }
}
