import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { UserImageUrlService } from "../services/UserImageUrlService";
import { createResponse, createServerErrorResponse, extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IUserImageUrls } from "../models/urlModel";

export class UserImageUrlController extends BaseController<IUserImageUrls, UserImageUrlService> {
  constructor() {
    super(new UserImageUrlService());
  }

  async addImageUrl(event: APIGatewayEvent) {
    const { userId, imageUrl } = extractBodyFromEvent(event);

    try {
      await this.service.addImageUrl(userId, imageUrl);

      return createResponse(StatusCode.CREATED, "Image URL added successfully");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}
