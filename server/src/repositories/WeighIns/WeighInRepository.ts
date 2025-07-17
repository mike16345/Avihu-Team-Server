import { IWeighIn, IWeighIns } from "../../interfaces/IWeighIns";
import { WeighIns } from "../../models/weighInModel";
import { BaseRepository } from "../BaseRepository";

export default class WeighInsRepository extends BaseRepository<IWeighIns> {
  constructor() {
    super(WeighIns);
  }

  addWeighIn = async (weighIn: IWeighIn, userId: string): Promise<IWeighIns> => {
    const weighInsDoc = await WeighIns.findOneAndUpdate(
      { userId },
      { $push: { weighIns: weighIn } },
      { new: true, upsert: true }
    );

    return weighInsDoc;
  };

  deleteWeighInById = async (id: string): Promise<IWeighIns | null> => {
    const result = await WeighIns.findOneAndUpdate(
      { "weighIns._id": id },
      { $pull: { weighIns: { _id: id } } },
      { new: true }
    );

    return result;
  };
}
