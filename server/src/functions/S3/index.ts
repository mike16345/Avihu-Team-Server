import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { S3 } from "aws-sdk";
import { createResponse, createServerErrorResponse, extractBodyFromEvent } from "../../utils/utils";
import { StatusCode } from "../../enums/StatusCode";
import { API_HEADERS } from "../../constants/Constants";

console.log(" secretAccessKey: process.env.SECRET_KEY,", process.env.SECRET_KEY);
console.log(" secretAccessKey: process.env.SECRET_KEY,", process.env.ACCESS_KEY);

const BASE_PATH = "/s3/photos";
const s3 = new S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.REGION,
  signatureVersion: "v4",
});

const handleDeletePhoto = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { photoId } = extractBodyFromEvent(event);

  if (!photoId) {
    return createResponse(StatusCode.BAD_REQUEST, "Missing required query parameter: photoId");
  }

  console.log("photoId", photoId);
  const paramsDelete: S3.Types.DeleteObjectRequest = {
    Bucket: process.env.AWS_BUCKET as string,
    Key: photoId,
  };

  try {
    const res = await s3.deleteObject(paramsDelete).promise();

    console.log("deleted object", res);
    return createResponse(StatusCode.OK, `Photo with ID '${photoId}' deleted successfully.`);
  } catch (error: any) {
    console.error("Error deleting photo:", error);
    return createServerErrorResponse(error);
  }
};

const s3ApiHandlers = {
  [`DELETE ${BASE_PATH}/one`]: handleDeletePhoto,
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
    console.log("res before", response);
    console.log("response", { ...response, headers: { ...API_HEADERS } });

    return { ...response, headers: { ...API_HEADERS } };
  }

  return {
    statusCode: StatusCode.BAD_GATEWAY,
    body: JSON.stringify({ message: `${routeKey} is not a valid route!` }),
    headers: { ...API_HEADERS },
  };
};
