import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { UserImageUrlController } from "../../controllers/UserImageUrlController";
import {
  validateUserImageUrl,
  validateUserImageUrlReplace,
} from "../../middleware/UserImageUrlMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/userImageUrls";

const userImageUrlController = new UserImageUrlController();

const userImageApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/user`]: {
    handler: userImageUrlController.getOne,
    access: "subtrainer",
  },
  [`POST ${BASE_PATH}`]: {
    handler: userImageUrlController.addImageUrl,
    access: "authenticated",
    middlewares: [validateUserImageUrl],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: userImageUrlController.replaceImageUrl,
    access: "authenticated",
    middlewares: [validateUserImageUrlReplace],
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, userImageApiRoutes);
};
