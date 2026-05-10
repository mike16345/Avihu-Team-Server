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
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/paginate`]: {
    handler: blogController.getPaginated,
    access: "public",
  },
  [`GET ${BASE_PATH}/count`]: {
    handler: blogController.getBlogCountByGroup,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: blogController.updateBlog,
    access: "trainerOrAdmin",
    middlewares: [validateBlogPost],
  },
  [`PUT ${BASE_PATH}/one/like`]: {
    handler: blogController.changeLikedStatus,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one/viewer`]: {
    handler: blogController.addViewer,
    access: "public",
  },
  [`POST ${BASE_PATH}`]: {
    handler: blogController.addBlog,
    access: "trainerOrAdmin",
    middlewares: [validateBlogPost],
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: blogController.getById,
    access: "public",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: blogController.deleteById,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, blogApiRoutes);
};
