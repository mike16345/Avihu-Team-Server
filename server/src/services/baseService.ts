import { FilterQuery, Model, UpdateWriteOpResult } from "mongoose";
import { Cache } from "../utils/cache";
import paginate, {
  generatePaginationCacheKey,
  PaginationParams,
  PaginationResult,
} from "../utils/pagination";
import { stableStringify } from "../utils/utils";

export class BaseService<T> {
  protected cache = new Cache<any>();
  protected model: Model<T>;
  protected baseCacheKey: string;

  constructor(model: Model<T>, baseCacheKey: string) {
    this.model = model;
    this.baseCacheKey = baseCacheKey;
  }

  private generateCacheKey(prefix: string, identifier: string): string {
    return `${this.baseCacheKey}:${prefix}:${identifier}`;
  }

  async create(doc: any): Promise<T> {
    const newDoc = await this.model.create(doc);

    if (!newDoc) throw new Error("Could not create item!");

    this.cache.invalidateAll();

    return newDoc;
  }

  async find(query: FilterQuery<T> = {}, cacheKey?: string): Promise<T[]> {
    const key = cacheKey || this.generateCacheKey("query", stableStringify(query));
    let data = this.cache.get(key);

    if (!data) {
      data = await this.model.find(query).lean().exec();
      if (!data) throw new Error("Data could not be retrieved!");
      this.cache.set(key, data);
    }

    return data;
  }

  async findPaginated(
    query: Omit<PaginationParams, "model">,
    resource: string = ""
  ): Promise<PaginationResult<T>> {
    const cacheKey = this.generateCacheKey(
      "paginated",
      generatePaginationCacheKey(resource || this.baseCacheKey, { model: this.model, ...query })
    );
    let data = this.cache.get(cacheKey);

    if (!data) {
      data = await paginate<T>({ model: this.model, ...query });
      if (!data) throw new Error("Error retrieving page!");
      this.cache.set(cacheKey, data);
    }

    return data;
  }

  async findById(id: string, cacheKey?: string): Promise<T | null> {
    const key = cacheKey || this.generateCacheKey("id", id);
    let item = this.cache.get(key);

    if (!item) {
      item = await this.model.findById(id).lean().exec();
      if (!item) throw new Error("Could not retrieve item!");
      this.cache.set(key, item);
    }

    return item;
  }

  async findOne(query: FilterQuery<T>, cacheKey?: string): Promise<T | null> {
    const key = cacheKey || this.generateCacheKey("one", stableStringify(query));
    let item = this.cache.get(key);

    if (!item) {
      item = await this.model.findOne(query).lean().exec();
      if (!item) throw new Error("Could not retrieve item!");
      this.cache.set(key, item);
    }

    return item;
  }

  async updateOne(query: FilterQuery<T>, data: any) {
    const updatedDoc = await this.model.findOneAndUpdate(query, data, { new: true }).lean().exec();

    if (!updatedDoc) throw new Error("Item not found");

    this.cache.invalidateAll();

    return updatedDoc;
  }

  async updateById(id: string, data: any) {
    const updatedDoc = await this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();

    if (!updatedDoc) throw new Error("Item not found");

    this.cache.invalidateAll();

    return updatedDoc;
  }

  async updateMany(query: FilterQuery<T>, data: any): Promise<UpdateWriteOpResult> {
    const updateResult = await this.model.updateMany(query, data);

    if (!updateResult) throw new Error("Update failed");

    this.cache.invalidateAll();

    return updateResult;
  }

  async deleteById(id: string) {
    const deletedDoc = await this.model.findByIdAndDelete(id).lean().exec();

    if (!deletedDoc) throw new Error("Item not found");

    this.cache.invalidateAll();

    return deletedDoc;
  }

  async delete(query: FilterQuery<T>) {
    const deletedDoc = await this.model.findOneAndDelete(query).lean().exec();

    if (!deletedDoc) throw new Error("Item not found");

    this.cache.invalidateAll();

    return deletedDoc;
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const deleteResult = await this.model.deleteMany(query);

    if (!deleteResult) throw new Error("Delete failed");

    this.cache.invalidateAll();

    return deleteResult;
  }
}
