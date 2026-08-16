import { Types } from "mongoose";
import {
  FoodCatalogAdminOverrides,
  IFoodCatalogItem,
  NormalizedOpenFoodFactsProduct,
} from "../../interfaces/IFoodCatalogItem";
import { FoodCatalogItemModel } from "../../models/foodCatalogItemModel";
import {
  buildFoodCatalogSearchFields,
  FoodCatalogSearchFields,
  tokenizeFoodCatalogSearch,
} from "../../utils/foodCatalogSearch";
import { BaseRepository } from "../BaseRepository";
import { buildFoodCatalogProvenance } from "../../utils/foodCatalogProvenance";

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  async searchCatalog(query: string, limit: number): Promise<any[]> {
    const terms = tokenizeFoodCatalogSearch(query);
    const filter: any = terms.length
      ? {
          $or: [
            { "search.prefixes": { $all: terms } },
            {
              $and: terms.map((term) => {
                const expression = new RegExp(`(^|\\s)${escapeRegex(term)}`, "u");
                return {
                  $or: [
                    { "search.normalizedNames": expression },
                    { "search.normalizedBrand": expression },
                    { "search.aliases": expression },
                  ],
                };
              }),
            },
          ],
        }
      : {};

    return FoodCatalogItemModel.find(filter)
      .sort({ "analytics.consumptionCount": -1, "analytics.lookupCount": -1, _id: 1 })
      .limit(limit)
      .lean();
  }

  async findMissingSearchItems(limit: number): Promise<any[]> {
    return FoodCatalogItemModel.find({
      $or: [{ "search.prefixes": { $exists: false } }, { "search.prefixes": { $size: 0 } }],
    })
      .limit(limit)
      .lean();
  }

  async bulkUpdateSearchFields(
    updates: Array<{
      itemId: string;
      search: FoodCatalogSearchFields;
      adminOverridesUpdatedAt: Date | null;
      normalizedDataHash: string;
    }>
  ): Promise<void> {
    if (!updates.length) return;
    await FoodCatalogItemModel.bulkWrite(
      updates.map(({ itemId, search, adminOverridesUpdatedAt, normalizedDataHash }) => ({
        updateOne: {
          filter: this.searchVersionFilter(itemId, adminOverridesUpdatedAt, normalizedDataHash),
          update: { $set: { search } },
        },
      }))
    );
  }

  async updateSearchFields(
    itemId: string,
    search: FoodCatalogSearchFields,
    adminOverridesUpdatedAt: Date | null,
    normalizedDataHash: string
  ): Promise<any | null> {
    return FoodCatalogItemModel.findOneAndUpdate(
      this.searchVersionFilter(itemId, adminOverridesUpdatedAt, normalizedDataHash),
      { $set: { search } },
      { new: true }
    ).lean();
  }

  private searchVersionFilter(
    itemId: string,
    adminOverridesUpdatedAt: Date | null,
    normalizedDataHash: string
  ): any {
    const providerVersion = { "source.normalizedDataHash": normalizedDataHash };
    return adminOverridesUpdatedAt
      ? {
          _id: itemId,
          ...providerVersion,
          "adminOverrides.updatedAt": adminOverridesUpdatedAt,
        }
      : {
          _id: itemId,
          ...providerVersion,
          $or: [{ adminOverrides: null }, { adminOverrides: { $exists: false } }],
        };
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
    const provenance = buildFoodCatalogProvenance("open_food_facts", canonicalBarcode);

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
          search: buildFoodCatalogSearchFields(normalized.providerData),
          source: {
            provider: "open_food_facts",
            providerId: normalized.providerData.identifiers.providerId,
            license: provenance.license,
            sourceUrl: provenance.sourceUrl,
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
    const provenance = buildFoodCatalogProvenance(
      "open_food_facts",
      normalized.providerData.identifiers.barcode ?? normalized.providerData.identifiers.providerId
    );
    return FoodCatalogItemModel.findByIdAndUpdate(
      itemId,
      {
        $set: {
          providerData: normalized.providerData,
          "source.providerId": normalized.providerData.identifiers.providerId,
          "source.license": provenance.license,
          "source.sourceUrl": provenance.sourceUrl,
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
