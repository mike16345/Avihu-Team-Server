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

  async swapImageUrls(userId: string, oldImageUrl: string, newImageUrl: string) {
    const doc = await this.model.findOne({ userId }).exec();

    if (!doc) {
      throw {
        status: 404,
        message: "User image URLs not found.",
      };
    }

    const firstIndex = doc.imageUrls.indexOf(oldImageUrl);
    const secondIndex = doc.imageUrls.indexOf(newImageUrl);

    if (firstIndex === -1 || secondIndex === -1) {
      throw {
        status: 404,
        message: "One or both image URLs not found for swap.",
      };
    }

    if (firstIndex === secondIndex) {
      return doc.toObject();
    }

    [doc.imageUrls[firstIndex], doc.imageUrls[secondIndex]] = [
      doc.imageUrls[secondIndex],
      doc.imageUrls[firstIndex],
    ];

    await doc.save();

    return doc.toObject();
  }
}
