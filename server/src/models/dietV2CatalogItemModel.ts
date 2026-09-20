import { model, Schema } from "mongoose";
import { IDietV2CatalogItem } from "../interfaces/IDietV2CatalogItem";
import { DIET_V2_CATALOG_CATEGORIES } from "../interfaces/IDietPlanV2";

export const DIET_V2_CATALOG_COLLECTION = "dietv2catalogitems";

export const dietV2CatalogItemSchema = new Schema<IDietV2CatalogItem>(
  {
    trainerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "trainers",
    },
    category: {
      type: String,
      required: true,
      enum: DIET_V2_CATALOG_CATEGORIES,
    },
    name: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Catalog item name must not be blank",
      },
    },
    normalizedName: {
      type: String,
      required: true,
    },
    usageCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    collection: DIET_V2_CATALOG_COLLECTION,
  }
);

dietV2CatalogItemSchema.index(
  { trainerId: 1, category: 1, normalizedName: 1 },
  { unique: true }
);
dietV2CatalogItemSchema.index({
  trainerId: 1,
  category: 1,
  usageCount: -1,
  lastUsedAt: -1,
});

export const DietV2CatalogItemModel = model<IDietV2CatalogItem>(
  "dietV2CatalogItems",
  dietV2CatalogItemSchema,
  DIET_V2_CATALOG_COLLECTION
);
