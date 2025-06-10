import { Cache } from "../utils/cache";
import paginate, {
  generatePaginationCacheKey,
  PaginationParams,
  PaginationResult,
} from "../utils/pagination";

export class BaseService<T> {
  protected cache = new Cache<T>();

  async create(doc: any, Model: any): Promise<T> {
    const newDoc = await Model.create(doc);

    if (!newDoc) throw new Error("Could not create item!");

    this.cache.invalidateAll();

    return newDoc;
  }

  async findAll(Model: any, cacheKey: string, query?: Record<string, any>): Promise<T[]> {
    const data = this.cache.get(cacheKey) || (await Model.find(query || {}));

    if (!data) throw new Error("Data could not be retrieved!");

    this.cache.set(cacheKey, data);

    return data;
  }

  async findPaginated(query: PaginationParams, resource: string): Promise<PaginationResult<T>> {
    const cacheKey = generatePaginationCacheKey(resource, query);

    const data = this.cache.get(cacheKey) || (await paginate<T>(query));

    if (!data) throw new Error("Error retrieving page!");

    this.cache.set(cacheKey, data);

    return data;
  }

  protected async findById(id: string, Model: any, cacheKey?: string): Promise<T | null> {
    const item = this.cache.get(cacheKey || id) || (await Model.findById(id));

    if (!item) throw new Error("Could not retrieve item!");

    this.cache.set(cacheKey || id, item);

    return item;
  }

  protected async findOne(query: object, Model: any, cacheKey: string): Promise<T | null> {
    const item = this.cache.get(cacheKey) || (await Model.findOne(query));

    if (!item) throw new Error("Could not retrieve item!");
    this.cache.set(cacheKey, item);

    return item;
  }

  protected async update(id: string, data: any, Model: any): Promise<T | null> {
    const updatedDoc = await Model.findByIdAndUpdate(id, data, { new: true });

    if (!updatedDoc) throw new Error(`Item not found`);

    this.cache.invalidateAll();

    return updatedDoc;
  }

  protected async delete(id: string, Model: any): Promise<T | null> {
    const deletedDoc = await Model.findByIdAndDelete(id);

    if (!deletedDoc) throw new Error(`Item not found`);

    this.cache.invalidateAll();

    return deletedDoc;
  }
}
