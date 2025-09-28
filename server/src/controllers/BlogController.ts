import { BlogService } from "../services/BlogService";
import { IBlog } from "../interfaces/IBlog";
import BaseController from "./BaseController";
import { APIGatewayProxyEvent } from "aws-lambda";
import { extractBodyFromEvent, extractQueryFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import { LessonGroupService } from "../services/LessonGroupService";

export class BlogController extends BaseController<IBlog, BlogService> {
  constructor() {
    super(new BlogService());
  }

  private sanitizeBlog = async (blog: IBlog): Promise<IBlog> => {
    const isGroupAString = typeof blog.group === "string";

    if (isGroupAString) {
      const group = await new LessonGroupService().findOne({ name: blog.group });

      if (!group) throw new Error("Could not find respective lesson group");

      blog.group = group._id!;
    } else {
      const groupId = blog.group._id;

      blog.group = groupId!;
    }

    return blog;
  };

  addBlog = async (event: APIGatewayProxyEvent) => {
    const data = extractBodyFromEvent(event);

    try {
      const blog = await this.sanitizeBlog(data);
      const newBlog = await this.service.create(blog);

      return this.successResponse({
        data: newBlog,
        message: "Blog created successfully",
        status: StatusCode.CREATED,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  updateBlog = async (event: APIGatewayProxyEvent) => {
    const data = extractBodyFromEvent(event);
    const { id } = extractQueryFromEvent(event);

    try {
      const blog = await this.sanitizeBlog(data);

      const updatedBlog = await this.service.updateById(id, blog);

      return this.successResponse({
        data: updatedBlog,
        message: "Blog updated!",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  changeLikedStatus = async (event: APIGatewayProxyEvent) => {
    const { error, id, userId } = this.getParamsOrError(event, ["id", "userId"], "body");

    if (error) return error;
    try {
      const blog = await this.service.changeLikedStatus(id, userId);

      return this.successResponse({
        data: blog,
        message: "Blog updated successfully",
        status: StatusCode.OK,
      });
    } catch (error) {
      this.errorResponse(error);
    }
  };

  addViewer = async (event: APIGatewayProxyEvent) => {
    const { error, id, userId } = this.getParamsOrError(event, ["id", "userId"], "body");

    if (error) return error;
    try {
      const blog = await this.service.addViewer(id, userId);

      return this.successResponse({
        data: blog,
        message: "Viewer added successfully",
        status: StatusCode.OK,
      });
    } catch (error) {
      this.errorResponse(error);
    }
  };

  getBlogCountByGroup = async (event: APIGatewayProxyEvent) => {
    try {
      const blogCount = await this.service.getBlogCountsByGroup();

      return this.successResponse({
        data: blogCount,
        message: "Blog count retrieved successfully",
        status: StatusCode.OK,
      });
    } catch (error) {
      this.errorResponse(error);
    }
  };
}
