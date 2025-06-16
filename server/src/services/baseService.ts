import { FilterQuery, UpdateWriteOpResult } from "mongoose";
import { Cache } from "../utils/cache";
import {
  generatePaginationCacheKey,
  PaginationParams,
  PaginationResult,
} from "../utils/pagination";
import { stableStringify } from "../utils/utils";
import { BaseRepository } from "../repositories/BaseRepository";
import { FindOptions } from "../types/mongooseTypes";

export class BaseService<T> {
  protected cache = new Cache<any>();
  protected repository: BaseRepository<T>;
  protected baseCacheKey: string;

  constructor(repository: BaseRepository<T>, baseCacheKey: string) {
    this.repository = repository;
    this.baseCacheKey = baseCacheKey;
  }

  private generateCacheKey(prefix: string, identifier: string): string {
    return `${this.baseCacheKey}:${prefix}:${identifier}`;
  }

  async create(doc: any) {
    const newDoc = await this.repository.create(doc);
    this.cache.invalidateAll();

    return newDoc;
  }

  async find(query: FilterQuery<T> = {}): Promise<T[]> {
    const key = this.generateCacheKey("query", stableStringify(query));
    let data = this.cache.get(key);

    if (data) return data;

    data = await this.repository.find({ query });
    if (!data) throw new Error("Data could not be retrieved!");
    this.cache.set(key, data);

    return data;
  }

  async findPaginated(
    query: Omit<PaginationParams, "model">,
    resource: string = ""
  ): Promise<PaginationResult<T>> {
    const cacheKey = this.generateCacheKey(
      "paginated",
      generatePaginationCacheKey(resource || this.baseCacheKey, query)
    );

    let data = this.cache.get(cacheKey);

    if (data) return data;

    data = await this.repository.getPaginated(query);
    if (!data) throw new Error("Error retrieving page!");

    this.cache.set(cacheKey, data);

    return data;
  }

  async findById(id: string) {
    const key = this.generateCacheKey("id", id);
    let item = this.cache.get(key);

    if (item) return item;

    item = await this.repository.findById(id);
    if (!item) throw new Error("Could not retrieve item!");
    this.cache.set(key, item);

    return item;
  }

  async findOne(options: FindOptions<T>) {
    const key = this.generateCacheKey("one", stableStringify(options.query));
    let item = this.cache.get(key);

    if (item) return item;

    item = await this.repository.findOne(options);
    if (!item) throw new Error("Could not retrieve item!");
    this.cache.set(key, item);

    return item;
  }

  async updateOne(query: FilterQuery<T>, data: any) {
    const updatedDoc = await this.repository.updateOne(query, data);
    this.cache.invalidateAll();

    return updatedDoc;
  }

  async updateById(id: string, data: any) {
    const updatedDoc = await this.repository.updateById(id, data);
    const key = this.generateCacheKey("id", id);
    this.cache.invalidateAll();

    return updatedDoc;
  }

  async updateMany(query: FilterQuery<T>, data: any): Promise<UpdateWriteOpResult> {
    const result = await this.repository.updateMany(query, data);
    this.cache.invalidateAll();

    return result;
  }

  async deleteById(id: string) {
    const deletedDoc = await this.repository.deleteById(id);
    this.cache.invalidateAll();

    return deletedDoc;
  }

  async delete(query: FilterQuery<T>) {
    const deletedDoc = await this.repository.delete(query);
    this.cache.invalidateAll();

    return deletedDoc;
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const result = await this.repository.deleteMany(query);
    this.cache.invalidateAll();

    return result;
  }
}
