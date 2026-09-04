import { APIGatewayEvent, Context } from "aws-lambda";
import S3 from "aws-sdk/clients/s3";
import { createResponse, createResponseWithData } from "../../utils/utils";
import { StatusCode } from "../../enums/StatusCode";
import { API_HEADERS } from "../../constants/Constants";
import { buildS3ObjectKey } from "../../utils/s3ObjectKey";

const s3 = new S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.AMAZON_REGION,
  signatureVersion: "v4",
});

const ONE_MIN = 60;
const URL_TTL = ONE_MIN * 10;

export const handler = async (event: APIGatewayEvent, context: Context) => {
  const bucketName = process.env.AWS_BUCKET;
  const httpMethod = event.httpMethod;
  const methodToAllow = getMethodToAllow(httpMethod);
  const folderName = event.queryStringParameters?.folderName || "images";
  const fileName = event.queryStringParameters?.imageName;
  const clientId = event.queryStringParameters?.userId;
  const contentType = event.queryStringParameters?.contentType || "image/jpeg";
  const date = event.queryStringParameters?.date;

  console.log(`${httpMethod} Event:`, JSON.stringify(event));

  if (!methodToAllow) {
    return {
      ...createResponse(StatusCode.BAD_REQUEST, `${httpMethod} is not supported for this request`),
      headers: API_HEADERS,
    };
  }
  try {
    const objectKey = buildS3ObjectKey({ folderName, clientId, date, fileName });
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Expires: URL_TTL,
      ContentType: contentType,
    };
    console.log("method to allow ", methodToAllow);
    console.log("params", JSON.stringify(params));
    const signedUrl = s3.getSignedUrl(methodToAllow, params);
    console.log("Signed URL:", JSON.stringify(signedUrl));

    return { ...createResponseWithData(StatusCode.OK, signedUrl), headers: API_HEADERS };
  } catch (e: any) {
    console.log("Error retrieving signed url:", JSON.stringify(e));
    return {
      ...createResponse(StatusCode.BAD_REQUEST, e?.message || "Invalid image path"),
      headers: API_HEADERS,
    };
  }
};

function getMethodToAllow(httpMethod: string) {
  if (httpMethod === "GET") {
    return "getObject";
  } else if (httpMethod === "POST") {
    return "putObject";
  }
}
