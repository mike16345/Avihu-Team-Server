import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { BlogController } from "../../controllers/BlogController";
import { validateBlogPost } from "../../middleware/blogMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/blogs";

const blogController = new BlogController();

const blogApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: blogController.getAll,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/paginate`]: {
    handler: blogController.getPaginated,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/count`]: {
    handler: blogController.getBlogCountByGroup,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: blogController.updateBlog,
    access: "subtrainer",
    middlewares: [validateBlogPost],
  },
  [`PUT ${BASE_PATH}/one/like`]: {
    handler: blogController.changeLikedStatus,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one/viewer`]: {
    handler: blogController.addViewer,
    access: "authenticated",
  },
  [`POST ${BASE_PATH}`]: {
    handler: blogController.addBlog,
    access: "subtrainer",
    middlewares: [validateBlogPost],
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: blogController.getById,
    access: "authenticated",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: blogController.deleteById,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, blogApiRoutes);
};
