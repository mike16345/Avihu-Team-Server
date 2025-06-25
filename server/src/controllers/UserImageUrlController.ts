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
}
