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

      return urls?.imageUrls || [];
    } catch (e: any) {
      throw e;
    }
  }

  async findOne(filter: Partial<Record<keyof IUserImageUrls, any>>): Promise<any> {
    const doc = await super.findOne(filter);

    if (!doc) return [];

    return doc.imageUrls || [];
  }
}
