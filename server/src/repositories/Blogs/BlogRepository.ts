import { Document, Types } from "mongoose";
import { IBlog } from "../../interfaces/IBlog";
import { BlogModel } from "../../models/blogsModel";
import { LessonGroup } from "../../models/lessonGroupsModel";
import { FindOptions } from "../../types/mongooseTypes";
import { BaseRepository } from "../BaseRepository";
import { StatusCode } from "../../enums/StatusCode";
import { FIND_ONE_FAILURE } from "../../constants/repository";
import { PaginationParams, PaginationResult } from "../../utils/pagination";

export class BlogRepository extends BaseRepository<IBlog> {
  constructor() {
    super(BlogModel);
  }

  private async populateBlogs(queryOrDocs: any) {
    const options = { path: "group", model: LessonGroup };

    if (typeof queryOrDocs.populate === "function") {
      return queryOrDocs.populate(options);
    }

    // In the case that a query isnt being passed in
    return this.model.populate(queryOrDocs, options);
  }

  findOne = async (options: FindOptions<IBlog>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const queryResult = this.model.findOne(query, projection, queryOptions);

    const blog = await this.populateBlogs(queryResult);

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return blog;
  };

  findById = async (id: string | Types.ObjectId): Promise<any> => {
    const blog = await this.populateBlogs(this.model.findById(id));

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return blog;
  };

  find = async (options: FindOptions<IBlog>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const blogs = await this.populateBlogs(this.model.find(query, projection, queryOptions));

    return blogs;
  };

  getPaginatedBlogs = async (
    paginationParams: PaginationParams
  ): Promise<PaginationResult<IBlog>> => {
    const paginated = await this.getPaginated(paginationParams);
    paginated.results = await this.populateBlogs(paginated.results);

    return paginated;
  };

  addViewer = async (id: string, userId: string) => {
    const blog = await this.model.findByIdAndUpdate(
      id,
      { $addToSet: { views: userId } },
      { new: true }
    );

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: "Article not found" };
    }

    return blog;
  };

  changeLikedStatus = async (id: string, userId: string) => {
    const blog = await this.model.findById(id);

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: "Article not found" };
    }

    const hasLiked = blog.likes.includes(userId);

    const updatedBlog = await this.model.findByIdAndUpdate(
      id,
      hasLiked
        ? { $pull: { likes: userId } } // remove if exists
        : { $addToSet: { likes: userId } }, // add if not
      { new: true }
    );

    return updatedBlog;
  };

  getBlogCountsByGroup = async () => {
    const counts = await this.model.aggregate([
      {
        $group: {
          _id: "$group", // group by lessonGroup ObjectId
          count: { $sum: 1 }, // count blogs in each group
        },
      },
      {
        $lookup: {
          from: "lessongroups", // name of the lessonGroups collection
          localField: "_id", // the ObjectId stored in blogs.group
          foreignField: "_id", // match it against lessonGroups._id
          as: "lessonGroup",
        },
      },
      { $unwind: "$lessonGroup" }, // flatten the lessonGroup array
      {
        $project: {
          id: "$lessonGroup._id",
          name: "$lessonGroup.name", // pull just the name
          description: "$lessonGroup.description",
          count: 1,
        },
      },
    ]);

    return counts;
  };
}
