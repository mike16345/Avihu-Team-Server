import { Types } from "mongoose";
import {
  IDietV2CatalogItem,
  IDietV2NormalizedCatalogCandidate,
  DietV2PopularItems,
} from "../../interfaces/IDietV2CatalogItem";
import {
  DIET_V2_CATALOG_CATEGORIES,
  DietV2CatalogCategory,
} from "../../interfaces/IDietPlanV2";
import { DietV2CatalogItemModel } from "../../models/dietV2CatalogItemModel";
import { BaseRepository } from "../BaseRepository";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isDuplicateOnlyBulkError = (error: any): boolean => {
  if (error?.code === 11000) return true;

  const writeErrors = error?.writeErrors;

  return (
    Array.isArray(writeErrors) &&
    writeErrors.length > 0 &&
    writeErrors.every((writeError: any) => writeError?.code === 11000)
  );
};

export class DietV2CatalogRepository extends BaseRepository<IDietV2CatalogItem> {
  constructor() {
    super(DietV2CatalogItemModel, { type: "trainer", field: "trainerId" });
  }

  async upsertAndTouch(
    candidates: IDietV2NormalizedCatalogCandidate[],
    now: Date
  ): Promise<void> {
    const { trainerId } = this.getScopeMatch();
    const operations = candidates.map((candidate) => ({
      updateOne: {
        filter: {
          trainerId,
          category: candidate.category,
          normalizedName: candidate.normalizedName,
        },
        update: {
          $setOnInsert: {
            trainerId,
            category: candidate.category,
            normalizedName: candidate.normalizedName,
            name: candidate.name,
          },
          $set: { lastUsedAt: now },
          $inc: { usageCount: 1 },
        },
        upsert: true,
      },
    }));

    try {
      await DietV2CatalogItemModel.bulkWrite(operations, { ordered: false });
    } catch (error) {
      if (!isDuplicateOnlyBulkError(error)) throw error;
    }
  }

  async findByCandidates(
    candidates: IDietV2NormalizedCatalogCandidate[]
  ): Promise<IDietV2CatalogItem[]> {
    if (candidates.length === 0) return [];

    return await DietV2CatalogItemModel.find(
      this.applyScopeToQuery({
        $or: candidates.map((candidate) => ({
          category: candidate.category,
          normalizedName: candidate.normalizedName,
        })),
      })
    ).lean();
  }

  async search(
    category: DietV2CatalogCategory,
    normalizedQuery: string,
    limit: number
  ): Promise<IDietV2CatalogItem[]> {
    const scope = this.getScopeMatch();

    return await DietV2CatalogItemModel.aggregate<IDietV2CatalogItem>([
      {
        $match: {
          ...scope,
          category,
          normalizedName: { $regex: escapeRegex(normalizedQuery) },
        },
      },
      {
        $addFields: {
          searchPosition: { $indexOfCP: ["$normalizedName", normalizedQuery] },
        },
      },
      { $sort: { searchPosition: 1, usageCount: -1, lastUsedAt: -1 } },
      { $limit: limit },
      { $project: { searchPosition: 0 } },
    ]);
  }

  async getPopular(limit: number): Promise<DietV2PopularItems> {
    const scope = this.getScopeMatch();
    const entries = await Promise.all(
      DIET_V2_CATALOG_CATEGORIES.map(async (category) => {
        const items = await DietV2CatalogItemModel.find({ ...scope, category })
          .sort({ usageCount: -1, lastUsedAt: -1 })
          .limit(limit)
          .lean();

        return [category, items] as const;
      })
    );

    return Object.fromEntries(entries) as unknown as DietV2PopularItems;
  }

  async deleteScoped(id: string): Promise<IDietV2CatalogItem | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await DietV2CatalogItemModel.findOneAndDelete(
      this.applyScopeToQuery({ _id: new Types.ObjectId(id) })
    ).lean();
  }
}
