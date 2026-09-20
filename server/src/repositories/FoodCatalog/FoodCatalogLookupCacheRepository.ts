import { FoodCatalogLookupCacheModel } from "../../models/foodCatalogLookupCacheModel";

export class FoodCatalogLookupCacheRepository {
  async findActive(barcode: string, now: Date): Promise<any | null> {
    return FoodCatalogLookupCacheModel.findOne({ barcode, expiresAt: { $gt: now } }).lean();
  }

  async remember(
    barcode: string,
    status: "not_found" | "provider_error",
    expiresAt: Date
  ): Promise<void> {
    await FoodCatalogLookupCacheModel.updateOne(
      { barcode },
      { $set: { status, expiresAt } },
      { upsert: true }
    );
  }

  async clear(barcode: string): Promise<void> {
    await FoodCatalogLookupCacheModel.deleteOne({ barcode });
  }
}
