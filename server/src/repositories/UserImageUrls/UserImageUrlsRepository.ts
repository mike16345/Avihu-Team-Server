import { FilterQuery } from "mongoose";
import { IUserImageUrls, UserImageUrlsModel } from "../../models/urlModel";
import { BaseRepository } from "../BaseRepository";

export default class UserImageUrlsRepository extends BaseRepository<IUserImageUrls> {
  constructor() {
    super(UserImageUrlsModel);
  }

  async upsertImageUrl(filter: FilterQuery<IUserImageUrls>, imageUrl: string) {
    return await super.updateOne({
      filter,
      update: { $push: { imageUrls: imageUrl } },
      options: { new: true, upsert: true },
    });
  }
}
