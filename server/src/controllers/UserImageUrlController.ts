import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { UserImageUrlService } from "../services/UserImageUrlService";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IUserImageUrls } from "../models/urlModel";
import { getAuthContext } from "../utils/authContext";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CYCLE_SIZE = 4;

const enforceSelfOrElevated = (targetUserId: string) => {
  const ctx = getAuthContext();
  if (!ctx?.role || !ctx?.userId) {
    throw { status: StatusCode.UNAUTHORIZED, message: "Auth context missing" };
  }
  if (ctx.role === "user" && ctx.userId !== targetUserId) {
    throw { status: StatusCode.FORBIDDEN, message: "Cannot modify another user's photos" };
  }
};

const parseKeyDate = (imageUrl: string): number | null => {
  const match = imageUrl.match(/\/(\d{4})-(\d{2})-(\d{2})\//);
  if (!match) return null;
  const time = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`).getTime();
  return Number.isNaN(time) ? null : time;
};

const countThisWeek = (imageUrls: string[]): number => {
  const cutoff = Date.now() - ONE_WEEK_MS;
  let count = 0;
  for (const url of imageUrls) {
    const t = parseKeyDate(url);
    if (t !== null && t >= cutoff) count++;
  }
  return count;
};

export class UserImageUrlController extends BaseController<IUserImageUrls, UserImageUrlService> {
  constructor() {
    super(new UserImageUrlService());
  }

  addImageUrl = async (event: APIGatewayEvent) => {
    const { userId, imageUrl } = extractBodyFromEvent(event);

    try {
      enforceSelfOrElevated(userId);
      const ctx = getAuthContext();
      if (ctx?.role === "user") {
        let existingUrls: string[] = [];
        try {
          const doc = await this.service.findOne({ userId });
          existingUrls = Array.isArray(doc) ? doc : doc?.imageUrls || [];
        } catch (lookupErr: any) {
          if (lookupErr?.status !== StatusCode.NOT_FOUND) throw lookupErr;
        }
        if (countThisWeek(existingUrls) >= CYCLE_SIZE) {
          throw {
            status: StatusCode.TOO_MANY_REQUESTS,
            message: "כבר הועלה מחזור השבוע",
          };
        }
      }
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
      enforceSelfOrElevated(userId);
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
      enforceSelfOrElevated(userId);
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
