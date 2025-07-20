import { Types } from "mongoose";
import { DELETE_FAILURE } from "../../constants/repository";
import { StatusCode } from "../../enums/StatusCode";
import { IWeighIn, IWeighIns } from "../../interfaces/IWeighIns";
import { WeighIns } from "../../models/weighInModel";
import { BaseRepository } from "../BaseRepository";

export default class WeighInsRepository extends BaseRepository<IWeighIns> {
  constructor() {
    super(WeighIns);
  }

  addWeighIn = async (weighIn: IWeighIn, userId: string): Promise<IWeighIns> => {
    const weighInsDoc = await this.model.findOneAndUpdate(
      { userId },
      { $push: { weighIns: weighIn } },
      { new: true, upsert: true }
    );

    return weighInsDoc;
  };

  addManyWeighIns = async (weighIns: IWeighIn[], userId: string) => {
    const weighInsDoc = await this.model.findOneAndUpdate(
      { userId },
      { $push: { weighIns: { $each: weighIns } } },
      { new: true, upsert: true }
    );

    return weighInsDoc;
  };

  deleteWeighInById = async (id: string): Promise<IWeighIns | null> => {
    const objectId = new Types.ObjectId(id); // Convert to ObjectId

    const result = await this.model.findOneAndUpdate(
      { "weighIns._id": objectId },
      { $pull: { weighIns: { _id: objectId } } },
      { new: true }
    );
    if (!result) throw { status: StatusCode.NOT_FOUND, message: DELETE_FAILURE };

    return result;
  };
}
