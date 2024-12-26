import { IUserImageUrls, UserImageUrlsModel } from "../models/urlModel";
import { Cache } from "../utils/cache";

const urlsCache = new Cache<IUserImageUrls>();

export class UserImageUrlService {
  static async getUserImageUrls(userId: string) {
    try {
      const urls = urlsCache.get(userId) || (await UserImageUrlsModel.findOne({ userId }));
      urlsCache.set(userId, urls);

      return urls?.imageUrls;
    } catch (e: any) {
      throw e;
    }
  }

  static async addImageUrl(userId: string, imageUrl: string) {
    try {
      const urls = await UserImageUrlsModel.findOneAndUpdate(
        { userId },
        { $push: { imageUrls: imageUrl } },
        { new: true, upsert: true }
      );
      urlsCache.invalidate(userId);

      return urls;
    } catch (e: any) {
      throw e;
    }
  }

  static async deleteUserImageUrls(userId: string) {
    try {
      await UserImageUrlsModel.deleteOne({ userId });
      urlsCache.invalidate(userId);
    } catch (e: any) {
      throw e;
    }
  }
}
