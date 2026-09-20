import { InferSchemaType, model, Schema } from "mongoose";

export const FOOD_CATALOG_LOOKUP_CACHE_COLLECTION = "foodcataloglookupcache";

const foodCatalogLookupCacheSchema = new Schema(
  {
    barcode: { type: String, required: true, unique: true },
    status: { type: String, required: true, enum: ["not_found", "provider_error"] },
    expiresAt: { type: Date, required: true },
  },
  {
    collection: FOOD_CATALOG_LOOKUP_CACHE_COLLECTION,
    timestamps: true,
    strict: "throw",
  }
);

foodCatalogLookupCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type FoodCatalogLookupCache = InferSchemaType<typeof foodCatalogLookupCacheSchema>;
export const FoodCatalogLookupCacheModel = model(
  "FoodCatalogLookupCache",
  foodCatalogLookupCacheSchema,
  FOOD_CATALOG_LOOKUP_CACHE_COLLECTION
);
