import mongoose, { Document, isValidObjectId, Types } from "mongoose";
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
    super(BlogModel, { type: "trainer", field: "trainerId" });
  }

  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private normalizeGroupQuery(query: Record<string, any>) {
    const group = query.group;

    if (typeof group === "string" && isValidObjectId(group)) {
      query.group = mongoose.Types.ObjectId.createFromHexString(group);
      return;
    }

    if (group && typeof group === "object" && Array.isArray(group.$in)) {
      query.group = {
        $in: group.$in.map((value: unknown) =>
          typeof value === "string" && isValidObjectId(value)
            ? mongoose.Types.ObjectId.createFromHexString(value)
            : value
        ),
      };
    }
  }

  private async applySearchQuery(query: Record<string, any>, search: unknown) {
    if (typeof search !== "string" || !search.trim()) return;

    const regex = { $regex: this.escapeRegex(search.trim()), $options: "i" };
    const matchingGroups = await LessonGroup.find(this.applyScopeToQuery({ name: regex })).select(
      "_id"
    );
    const matchingGroupIds = matchingGroups.map((group) => group._id);
    const searchFields: Record<string, any>[] = [
      { title: regex },
      { subtitle: regex },
      { content: regex },
      { link: regex },
      { planType: regex },
    ];

    if (matchingGroupIds.length > 0) {
      searchFields.push({ group: { $in: matchingGroupIds } });
    }

    const searchQuery = {
      $or: searchFields,
    };

    query.$and = [...(Array.isArray(query.$and) ? query.$and : []), searchQuery];
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
    const queryResult = this.model.findOne(
      this.withScopedSoftDeleteFilter(query as Record<string, any>),
      projection,
      queryOptions
    );

    const blog = await this.populateBlogs(queryResult);

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return blog;
  };

  findById = async (id: string | Types.ObjectId): Promise<any> => {
    const blog = await this.populateBlogs(
      this.model.findOne(this.withScopedSoftDeleteFilter({ _id: id }))
    );

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return blog;
  };

  find = async (options: FindOptions<IBlog>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const blogs = await this.populateBlogs(
      this.model.find(
        this.withScopedSoftDeleteFilter(query as Record<string, any>),
        projection,
        queryOptions
      )
    );

    return blogs;
  };

  getPaginatedBlogs = async (
    paginationParams: PaginationParams
  ): Promise<PaginationResult<IBlog>> => {
    const { search, ...rawQuery } = paginationParams.query ?? {};
    const query = this.withScopedSoftDeleteFilter(rawQuery);

    if (query.planType) {
      const planType = query.planType;
      query.planType = { $in: [planType, "כללי"] };
    }

    this.normalizeGroupQuery(query);
    await this.applySearchQuery(query, search);

    const paginated = await this.getPaginated({
      ...paginationParams,
      query,
    });

    paginated.results = await this.populateBlogs(paginated.results);
    return paginated;
  };

  addViewer = async (id: string, userId: string) => {
    const blog = await this.model.findOneAndUpdate(
      this.applyScopeToQuery({ _id: id }),
      { $addToSet: { views: userId } },
      { new: true }
    );

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: "Article not found" };
    }

    return blog;
  };

  changeLikedStatus = async (id: string, userId: string) => {
    const blog = await this.model.findOne(this.withScopedSoftDeleteFilter({ _id: id }));

    if (!blog) {
      throw { status: StatusCode.NOT_FOUND, message: "Article not found" };
    }

    const hasLiked = blog.likes.includes(userId);

    const updatedBlog = await this.model.findOneAndUpdate(
      this.applyScopeToQuery({ _id: id }),
      hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { new: true }
    );

    return updatedBlog;
  };

  getBlogCountsByGroup = async (planType?: string) => {
    const query: Record<string, any> = {};

    if (planType) {
      query.planType = { $in: [planType, "כללי"] };
    }

    const pipeline: any[] = [
      {
        $match: this.withScopedSoftDeleteFilter(query),
      },
      {
        $group: {
          _id: "$group",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "lessongroups",
          localField: "_id",
          foreignField: "_id",
          as: "lessonGroup",
        },
      },
      { $unwind: "$lessonGroup" },
      {
        $project: {
          id: "$lessonGroup._id",
          name: "$lessonGroup.name",
          description: "$lessonGroup.description",
          count: 1,
        },
      },
    ];

    return this.model.aggregate(pipeline);
  };
}
