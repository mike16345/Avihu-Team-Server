import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { UserImageUrlService } from "../services/UserImageUrlService";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IUserImageUrls } from "../models/urlModel";

export class UserImageUrlController extends BaseController<IUserImageUrls, UserImageUrlService> {
  constructor() {
    super(new UserImageUrlService());
  }

  addImageUrl = async (event: APIGatewayEvent) => {
    const { userId, imageUrl } = extractBodyFromEvent(event);

    try {
      const res = await this.service.addImageUrl(userId, imageUrl);

      return this.successResponse({
        status: StatusCode.CREATED,
        data: res,
        message: "Image URL added successfully",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  replaceImageUrl = async (event: APIGatewayEvent) => {
    const { userId, oldImageUrl, newImageUrl } = extractBodyFromEvent(event);

    try {
      const res = await this.service.replaceImageUrl(userId, oldImageUrl, newImageUrl);

      return this.successResponse({
        status: StatusCode.OK,
        data: res,
        message: "Image URL replaced successfully",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  swapImageUrls = async (event: APIGatewayEvent) => {
    const { userId, oldImageUrl, newImageUrl } = extractBodyFromEvent(event);

    try {
      const res = await this.service.swapImageUrls(userId, oldImageUrl, newImageUrl);

      return this.successResponse({
        status: StatusCode.OK,
        data: res,
        message: "Image URLs swapped successfully",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
