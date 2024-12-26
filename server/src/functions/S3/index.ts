import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../../enums/StatusCode";
import { API_HEADERS } from "../../constants/Constants";
import { S3Controller } from "../../controllers/S3Controller";

const BASE_PATH = "/s3/photos";

const s3ApiHandlers = {
  [`DELETE ${BASE_PATH}/one`]: S3Controller.handleDeletePhoto,
  [`DELETE ${BASE_PATH}/many`]: S3Controller.handleDeleteManyPhotos,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;
  const routeKey = `${httpMethod} ${path}` as keyof typeof s3ApiHandlers;

  console.log("key", routeKey);

  if (s3ApiHandlers[routeKey]) {
    console.log("calling handler");

    const response = await s3ApiHandlers[routeKey](event);
    console.log("response", { ...response, headers: { ...API_HEADERS } });

    return { ...response, headers: { ...API_HEADERS } };
  }

  return {
    statusCode: StatusCode.BAD_GATEWAY,
    body: JSON.stringify({ message: `${routeKey} is not a valid route!` }),
    headers: { ...API_HEADERS },
  };
};
