import { IUserImageUrls } from "../models/urlModel";
import UserImageUrlsRepository from "../repositories/UserImageUrls/UserImageUrlsRepository";
import { BaseService } from "./baseService";

const baseKey = "user-image-urls";

export class UserImageUrlService extends BaseService<IUserImageUrls, UserImageUrlsRepository> {
  constructor() {
    super(new UserImageUrlsRepository(), baseKey);
  }

  async addImageUrl(userId: string, imageUrl: string) {
    try {
      const urls = await this.repository.upsertImageUrl({ userId }, imageUrl);
      this.cache.invalidateAll();

      return urls?.imageUrls || [];
    } catch (e: any) {
      throw e;
    }
  }

  async removeImageUrl(userId: string, imageUrl: string) {
    const urls = (await this.repository.removeImageUrl(userId, imageUrl)) as IUserImageUrls | null;
    this.cache.invalidateAll();

    return urls?.imageUrls || [];
  }

  async replaceImageUrl(userId: string, oldImageUrl: string, newImageUrl: string) {
    const urls = (await this.repository.replaceImageUrl(
      userId,
      oldImageUrl,
      newImageUrl
    )) as IUserImageUrls | null;

    if (!urls) {
      throw {
        status: 404,
        message: "Image URL not found for replacement.",
      };
    }

    this.cache.invalidateAll();

    return urls.imageUrls || [];
  }

  async findOne(filter: Partial<Record<keyof IUserImageUrls, any>>): Promise<any> {
    const doc = await super.findOne(filter);

    if (!doc) return [];

    return doc.imageUrls || [];
  }
}
