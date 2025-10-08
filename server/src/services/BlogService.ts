import { IBlog } from "../interfaces/IBlog";
import { BlogRepository } from "../repositories/Blogs/BlogRepository";
import { generatePaginationCacheKey, PaginationParams } from "../utils/pagination";
import { stableStringify } from "../utils/utils";
import { BaseService } from "./BaseService";

const baseKey = "blogs";

export class BlogService extends BaseService<IBlog, BlogRepository> {
  constructor() {
    super(new BlogRepository(), baseKey);
  }

  findPaginated = async (params: PaginationParams) => {
    try {
      const cacheKey = this.generateCacheKey(
        "paginated",
        generatePaginationCacheKey(this.baseCacheKey, params)
      );

      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const paginatedData = await this.repository.getPaginatedBlogs(params);

      this.cache.set(cacheKey, paginatedData);

      return paginatedData;
    } catch (error) {
      throw error;
    }
  };

  getBlogCountsByGroup = async () => {
    try {
      return await this.repository.getBlogCountsByGroup();
    } catch (error) {
      throw error;
    }
  };

  changeLikedStatus = async (id: string, userId: string) => {
    try {
      const updatedDoc = await this.repository.changeLikedStatus(id, userId);

      const queryStr = stableStringify({ group: updatedDoc?.group });

      this.cache.invalidateAllContaining(queryStr);
      this.cache.invalidateAllContaining(id);

      return updatedDoc;
    } catch (error) {
      throw error;
    }
  };

  addViewer = async (id: string, userId: string) => {
    try {
      const updatedDoc = await this.repository.addViewer(id, userId);

      const queryStr = stableStringify({ group: updatedDoc?.group });
      this.cache.invalidateAllContaining(queryStr);
      this.cache.invalidateAllContaining(id);

      return updatedDoc;
    } catch (error) {
      throw error;
    }
  };
}
