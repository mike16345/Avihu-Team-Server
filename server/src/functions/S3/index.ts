import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { S3Controller } from "../../controllers/S3Controller";
import { handleApiCall } from "../baseHandler";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/s3/photos";

const s3ApiRoutes: ApiRouteHandlers = {
  [`DELETE ${BASE_PATH}/one`]: {
    handler: S3Controller.handleDeletePhoto,
    access: "public",
  },
  [`DELETE ${BASE_PATH}/many`]: {
    handler: S3Controller.handleDeleteManyPhotos,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, s3ApiRoutes);
};
