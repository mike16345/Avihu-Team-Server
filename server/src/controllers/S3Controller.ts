import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3 } from "aws-sdk";
import { StatusCode } from "../enums/StatusCode";
import { UserImageUrlService } from "../services/UserImageUrlService";
import {
  createResponse,
  createServerErrorResponse,
  createServerResponse,
  extractBodyFromEvent,
} from "../utils/utils";

const s3 = new S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.AMAZON_REGION,
  signatureVersion: "v4",
});

export class S3Controller {
  private static userImageUrlService = new UserImageUrlService();

  private static resolveStoredImageUrl(photoId?: string, imageUrl?: string) {
    if (imageUrl) {
      return imageUrl;
    }

    if (!photoId) {
      return undefined;
    }

    return photoId.startsWith("images/") ? photoId.slice("images/".length) : photoId;
  }

  static handleDeletePhoto = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const { photoId, userId, imageUrl } = extractBodyFromEvent(event);

    if (!photoId) {
      return createResponse(StatusCode.BAD_REQUEST, "Missing required query parameter: photoId");
    }

    const paramsDelete: S3.Types.DeleteObjectRequest = {
      Bucket: process.env.AWS_BUCKET as string,
      Key: photoId,
    };

    try {
      await s3.deleteObject(paramsDelete).promise();
      const storedImageUrl = this.resolveStoredImageUrl(photoId, imageUrl);

      if (userId && storedImageUrl) {
        const updatedImageUrls = await this.userImageUrlService.removeImageUrl(userId, storedImageUrl);

        return createServerResponse(
          StatusCode.OK,
          `Photo with ID '${photoId}' deleted successfully.`,
          updatedImageUrls
        );
      }

      return createResponse(StatusCode.OK, `Photo with ID '${photoId}' deleted successfully.`);
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      return createServerErrorResponse(error);
    }
  };

  static handleDeleteManyPhotos = async (event: APIGatewayProxyEvent) => {
    const { photoIds } = extractBodyFromEvent(event);

    if (!photoIds) {
      return createResponse(StatusCode.BAD_REQUEST, "Missing required query parameter: photoIds");
    }

    try {
      for (const photoId of photoIds) {
        const paramsDelete: S3.Types.DeleteObjectRequest = {
          Bucket: process.env.AWS_BUCKET as string,
          Key: photoId,
        };

        await s3.deleteObject(paramsDelete).promise();
      }

      return createResponse(StatusCode.OK, "Multiple photos deleted successfully.");
    } catch (error) {
      console.error("Error deleting multiple photos:", error);
      return createServerErrorResponse(error);
    }
  };
}
