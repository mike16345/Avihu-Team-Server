import { FilterQuery } from "mongoose";
import { IUserImageUrls, UserImageUrlsModel } from "../../models/urlModel";
import { BaseRepository } from "../BaseRepository";

export default class UserImageUrlsRepository extends BaseRepository<IUserImageUrls> {
  constructor() {
    super(UserImageUrlsModel, { type: "global" });
  }

  async upsertImageUrl(filter: FilterQuery<IUserImageUrls>, imageUrl: string) {
    return await super.updateOne({
      filter,
      update: { $push: { imageUrls: imageUrl } },
      options: { new: true, upsert: true },
    });
  }

  async removeImageUrl(userId: string, imageUrl: string) {
    return await this.model
      .findOneAndUpdate({ userId }, { $pull: { imageUrls: imageUrl } }, { new: true, lean: true })
      .exec();
  }

  async replaceImageUrl(userId: string, oldImageUrl: string, newImageUrl: string) {
    return await this.model
      .findOneAndUpdate(
        { userId, imageUrls: oldImageUrl },
        { $set: { "imageUrls.$": newImageUrl } },
        { new: true, lean: true }
      )
      .exec();
  }
}
