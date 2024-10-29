import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { UserImageUrlService } from "../services/UserImageUrlService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
} from "../utils/utils";

export class UserImageUrlController {
  static async getUserImageUrls(event: APIGatewayEvent) {
    const { userId } = event.queryStringParameters || {};

    try {
      const urls = await UserImageUrlService.getUserImageUrls(userId || "");

      if (!urls) {
        return createResponse(StatusCode.NOT_FOUND, "User not found");
      }

      return createResponseWithData(StatusCode.OK, urls);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async addImageUrl(event: APIGatewayEvent) {
    const { userId, imageUrl } = extractBodyFromEvent(event);

    try {
      await UserImageUrlService.addImageUrl(userId, imageUrl);

      return createResponse(StatusCode.CREATED, "Image URL added successfully");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}
