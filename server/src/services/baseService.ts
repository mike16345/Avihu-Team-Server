import { UpdateWriteOpResult } from "mongoose";
import { Cache, getSharedCache } from "../utils/cache";
import {
  generatePaginationCacheKey,
  PaginationParams,
  PaginationResult,
} from "../utils/pagination";
import { stableStringify } from "../utils/utils";
import { BaseRepository } from "../repositories/BaseRepository";

export class BaseService<T, R extends BaseRepository<T>> {
  protected cache: Cache<any>;
  protected repository: R;
  protected baseCacheKey: string;

  constructor(repository: R, baseCacheKey: string) {
    this.repository = repository;
    this.baseCacheKey = baseCacheKey;
    this.cache = getSharedCache(baseCacheKey);
  }

  protected generateCacheKey(prefix: string, identifier: string): string {
    return `${this.baseCacheKey}:${prefix}:${identifier}`;
  }

  async create(doc: T) {
    const newDoc = await this.repository.create(doc);
    this.cache.invalidateAll();

    return newDoc;
  }

  async isExists(fields: Partial<T>): Promise<boolean> {
    const conditions = Object.entries(fields).map(([key, value]) => ({
      [key as any]: value as any,
    }));

    if (conditions.length === 0) return false;

    return await this.repository.isExists({ $or: conditions });
  }

  async find(filter: Partial<Record<keyof T, any>> = {}): Promise<T[]> {
    const key = this.generateCacheKey("query", stableStringify(filter));
    const cached = this.cache.get(key);

    if (cached) return cached;
    const data = await this.repository.find({ query: filter });

    this.cache.set(key, data);

    return data;
  }

  async findPaginated(
    params: PaginationParams,
    resource: string = ""
  ): Promise<PaginationResult<T>> {
    const cacheKey = this.generateCacheKey(
      "paginated",
      generatePaginationCacheKey(resource || this.baseCacheKey, params)
    );

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getPaginated(params);

    this.cache.set(cacheKey, data);
    return data;
  }

  async findById(id: string): Promise<T | null> {
    const key = this.generateCacheKey("id", id);
    const cached = this.cache.get(key);

    if (cached) return cached;
    const item = (await this.repository.findById(id)) as T;

    this.cache.set(key, item);

    return item;
  }

  async findOne(filter: Partial<Record<keyof T, any>>): Promise<T | null> {
    const key = this.generateCacheKey("one", stableStringify(filter));
    const cached = this.cache.get(key);

    if (cached) return cached;
    const item = (await this.repository.findOne({ query: filter })) as T;

    this.cache.set(key, item);

    return item;
  }

  async updateOne(filter: Partial<Record<keyof T, any>>, update: Partial<T>) {
    const updated = await this.repository.updateOne({
      filter,
      update,
      options: { new: true, lean: true },
    });

    this.cache.invalidateAll();

    return updated;
  }

  async updateById(id: string, update: Partial<T>) {
    const updated = await this.repository.updateById(id, {
      update,
      options: { new: true },
    });

    this.cache.invalidateAll();

    return updated;
  }

  async updateMany(
    filter: Partial<Record<keyof T, any>>,
    update: Partial<T>
  ): Promise<UpdateWriteOpResult> {
    const result = await this.repository.updateMany(filter, update);

    this.cache.invalidateAll();

    return result;
  }

  async deleteById(id: string) {
    const deleted = await this.repository.deleteById(id);

    this.cache.invalidateAll();

    return deleted;
  }

  async hardDeleteById(id: string) {
    const deleted = await this.repository.hardDeleteById(id);

    this.cache.invalidateAll();

    return deleted;
  }

  async delete(filter: Partial<Record<keyof T, any>>) {
    const deleted = await this.repository.delete(filter);

    this.cache.invalidateAll();

    return deleted;
  }

  async hardDelete(filter: Partial<Record<keyof T, any>>) {
    const deleted = await this.repository.hardDelete(filter);

    this.cache.invalidateAll();

    return deleted;
  }

  async deleteMany(filter: Partial<Record<keyof T, any>>): Promise<{ deletedCount?: number }> {
    const result = await this.repository.deleteMany(filter);

    this.cache.invalidateAll();

    return result;
  }
}
