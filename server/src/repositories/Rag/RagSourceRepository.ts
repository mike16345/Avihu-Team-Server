import RagSourceModel, { IRagSourceChunk } from "../../models/ragSourceModel";
import { BaseRepository } from "../BaseRepository";

export class RagSourceRepository extends BaseRepository<IRagSourceChunk> {
  constructor() {
    super(RagSourceModel);
  }

  async findByHash(userId: string, hash: string) {
    return await this.model.findOne({ userId, hash }).lean();
  }

  async upsertChunk(doc: IRagSourceChunk) {
    const { userId, sourceId, chunkId } = doc;
    return await this.model
      .findOneAndUpdate(
        { userId, sourceId, chunkId },
        { $set: doc },
        { upsert: true, new: true }
      )
      .lean();
  }
}
