import { APIGatewayEvent } from "aws-lambda";
import { BlogService } from "../services/BlogService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export class BlogController {
  static async getAllPosts(event: APIGatewayEvent) {
    try {
      const posts = await BlogService.getAllPosts();

      return createResponseWithData(StatusCode.OK, posts);
    } catch (err) {
      return createServerErrorResponse(err);
    }
  }

  static async getPostById(event: APIGatewayEvent) {
    const { id } = extractQueryFromEvent(event);

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Post ID is required.");
    }
    try {
      const post = await BlogService.getPostById(id);

      if (!post) {
        return createResponse(StatusCode.NOT_FOUND, "Post not found.");
      }
      return createResponseWithData(StatusCode.OK, post);
    } catch (err) {
      return createServerErrorResponse(err);
    }
  }
  static async createPost(event: APIGatewayEvent) {
    const postData = extractBodyFromEvent(event);

    if (!postData) {
      return createResponse(StatusCode.BAD_REQUEST, "Post data is required.");
    }
    try {
      const createdPost = await BlogService.createPost(postData);

      return createResponseWithData(StatusCode.CREATED, createdPost, "Post created successfully.");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updatePost(event: APIGatewayEvent) {
    const { id } = extractQueryFromEvent(event);
    const postData = extractBodyFromEvent(event);

    if (!id || !postData) {
      return createResponse(StatusCode.BAD_REQUEST, "Post ID and data are required.");
    }
    try {
      const updatedPost = await BlogService.updatePost(id, postData);
      if (!updatedPost) {
        return createResponse(StatusCode.NOT_FOUND, "Post not found.");
      }
      return createResponseWithData(StatusCode.OK, updatedPost, "Post updated successfully.");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
  static async deletePost(event: APIGatewayEvent) {
    const { id } = extractQueryFromEvent(event);

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Post ID is required.");
    }
    try {
      const deletedPost = await BlogService.deletePost(id);

      if (!deletedPost) {
        return createResponse(StatusCode.NOT_FOUND, "Post not found.");
      }
      return createResponse(StatusCode.NO_CONTENT, "Post deleted successfully.");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}
