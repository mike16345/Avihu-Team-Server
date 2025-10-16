import { FilterQuery } from "mongoose";
import RagCacheModel, { IRagCacheEntry } from "../../models/ragCacheModel";
import { BaseRepository } from "../BaseRepository";

export class RagCacheRepository extends BaseRepository<IRagCacheEntry> {
  constructor() {
    super(RagCacheModel);
  }

  findByNormalizedQuestion = async (
    userId: string,
    normalizedQuestion: string
  ): Promise<IRagCacheEntry | null> => {
    try {
      return await this.model
        .findOne({ userId, normalizedQuestion } as FilterQuery<IRagCacheEntry>)
        .lean();
    } catch (error) {
      return null;
    }
  };

  findByIdLean = async (id: string) => {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      return null;
    }
  };

  upsertCacheEntry = async (doc: IRagCacheEntry) => {
    const { userId, normalizedQuestion } = doc;
    return await this.model
      .findOneAndUpdate(
        { userId, normalizedQuestion },
        { $set: doc },
        { upsert: true, new: true }
      )
      .lean();
  };

  listRecent = async (userId: string, limit: number = 20) => {
    return await this.model.find({ userId }).sort({ updatedAt: -1 }).limit(limit).lean();
  };
}
