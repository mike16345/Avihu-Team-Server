import { Types } from "mongoose";
import { DietV2CatalogCategory } from "./IDietPlanV2";

export interface IDietV2CatalogCandidate {
  category: DietV2CatalogCategory;
  name: string;
  catalogItemId?: string;
}

export interface IDietV2NormalizedCatalogCandidate {
  category: DietV2CatalogCategory;
  name: string;
  normalizedName: string;
}

export interface IDietV2CatalogItem {
  _id?: Types.ObjectId;
  trainerId: Types.ObjectId;
  category: DietV2CatalogCategory;
  name: string;
  normalizedName: string;
  usageCount: number;
  lastUsedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DietV2PopularItems = Record<DietV2CatalogCategory, IDietV2CatalogItem[]>;
