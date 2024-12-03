import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { BlogController } from "../../controllers/BlogController";
import { validateBlogPost } from "../../middleware/blogMiddleware";

const BASE_PATH = "/blogs";

const blogApiHandlers = {
  [`GET ${BASE_PATH}`]: BlogController.getAllPosts,
  [`PUT ${BASE_PATH}/users`]: BlogController.updatePost,
  [`POST ${BASE_PATH}`]: BlogController.createPost,
  [`GET ${BASE_PATH}/one`]: BlogController.getPostById,
  [`DELETE ${BASE_PATH}/one`]: BlogController.deletePost,
};

const blogApiMiddleware = {
  [`POST ${BASE_PATH}`]: validateBlogPost,
  [`PUT ${BASE_PATH}/users`]: validateBlogPost,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, blogApiHandlers, blogApiMiddleware);
};
