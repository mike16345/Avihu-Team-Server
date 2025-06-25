import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { UserImageUrlController } from "../../controllers/UserImageUrlController";
import { validateUserImageUrl } from "../../middleware/UserImageUrlMiddleware";

const BASE_PATH = "/userImageUrls";

const userImageUrlController = new UserImageUrlController();

const userImageApiHandlers = {
  [`GET ${BASE_PATH}/user`]: userImageUrlController.getOne,
  [`POST ${BASE_PATH}`]: userImageUrlController.addImageUrl,
};

export const userImageMiddleWare = {
  [`POST ${BASE_PATH}`]: validateUserImageUrl,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, userImageApiHandlers, userImageMiddleWare);
};
