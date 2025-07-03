import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { BlogController } from "../../controllers/BlogController";
import { validateBlogPost } from "../../middleware/blogMiddleware";

const BASE_PATH = "/blogs";


const blogController=new BlogController();

const blogApiHandlers = {
  [`GET ${BASE_PATH}`]: blogController.getAll,
  [`GET ${BASE_PATH}/paginate`]:blogController.getPaginated,
  [`PUT ${BASE_PATH}/one`]:blogController.updateById,
  [`POST ${BASE_PATH}`]:blogController.create,
  [`GET ${BASE_PATH}/one`]:blogController.getById,
  [`DELETE ${BASE_PATH}/one`]:blogController.deleteById,
};

const blogApiMiddleware = {
  [`POST ${BASE_PATH}`]: validateBlogPost,
  [`PUT ${BASE_PATH}/one`]: validateBlogPost,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, blogApiHandlers, blogApiMiddleware);
};
