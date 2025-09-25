import { IBlog } from "../interfaces/IBlog";
import { BlogRepository } from "../repositories/Blogs/BlogRepository";
import { BaseService } from "./BaseService";

const baseKey = "blogs";

export class BlogService extends BaseService<IBlog, BlogRepository> {
  constructor() {
    super(new BlogRepository(), baseKey);
  }

  changeLikedStatus = async (id: string, userId: string) => {
    try {
      return await this.repository.changeLikedStatus(id, userId);
    } catch (error) {
      throw error;
    }
  };

  addViewer = async (id: string, userId: string) => {
    try {
      return await this.repository.addViewer(id, userId);
    } catch (error) {
      throw error;
    }
  };
}
