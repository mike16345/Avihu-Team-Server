import { IBlog } from "../interfaces/IBlog";
import { BlogRepository } from "../repositories/Blogs/BlogRepository";
import { BaseService } from "./BaseService";

const baseKey = "blogs";

export class BlogService extends BaseService<IBlog, BlogRepository> {
  constructor() {
    super(new BlogRepository(), baseKey);
  }
}
