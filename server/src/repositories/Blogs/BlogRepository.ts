import { IBlog } from "../../interfaces/IBlog";
import { BlogModel } from "../../models/blogsModel";
import { BaseRepository } from "../BaseRepository";

export class BlogRepository extends BaseRepository<IBlog> {
  constructor() {
    super(BlogModel);
  }
}
