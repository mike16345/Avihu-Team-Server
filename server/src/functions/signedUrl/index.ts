import { APIGatewayEvent, Context } from "aws-lambda";
import { S3 } from "aws-sdk";
import { createResponse, createResponseWithData } from "../../utils/utils";
import { StatusCode } from "../../enums/StatusCode";
import { API_HEADERS } from "../../constants/Constants";

const s3 = new S3();
const ONE_MIN = 60;
const URL_TTL = ONE_MIN * 5;

export const handler = async (event: APIGatewayEvent, context: Context) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const httpMethod = event.httpMethod;
  const methodToAllow = getMethodToAllow(httpMethod);
  const imageName = event.queryStringParameters?.imageName;
  const clientName = event.queryStringParameters?.name;
  const objectKey = `images/${clientName}/${imageName}`;

  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Expires: URL_TTL,
    ContentType: "image/jpeg",
  };

  if (!methodToAllow) {
    return {
      ...createResponse(StatusCode.BAD_REQUEST, `${httpMethod} is not supported for this request`),
      headers: API_HEADERS,
    };
  }

  console.log("event", JSON.stringify(event));

  const signedUrl = s3.getSignedUrl(methodToAllow, params);

  return { ...createResponseWithData(StatusCode.OK, signedUrl), headers: API_HEADERS };
};

function getMethodToAllow(httpMethod: string) {
  if (httpMethod === "GET") {
    return "getObject";
  } else if (httpMethod === "POST") {
    return "putObject";
  }
}
