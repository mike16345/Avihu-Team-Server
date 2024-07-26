import { WeighIns } from "../models/weighInModel";
import { IWeighIn } from "../interfaces/IWeighIns";

export class WeighInService {
  async addWeighIn(data: any, userId: string) {
    try {
      const { date, weight } = data;

      const weighInsDoc = await WeighIns.findOneAndUpdate(
        { userId },
        { $push: { weighIns: { date, weight } } },
        { new: true, upsert: true }
      );

      return weighInsDoc;
    } catch (err) {
      return err;
    }
  }

  async addManyWeighIns(data: IWeighIn[], id: string) {
    try {
      const weighInsDocs = await Promise.all(data.map((weighIn) => this.addWeighIn(weighIn, id)));

      return weighInsDocs;
    } catch (err: any) {
      throw err;
    }
  }

  async getWeighInsByUserId(id: string) {
    try {
      const weighIns = await WeighIns.findOne({ userId: id });

      return weighIns?.weighIns;
    } catch (err) {
      return err;
    }
  }

  async getWeighInsById(id: string) {
    try {
      const weighIns = await WeighIns.findOne({ id });

      return weighIns;
    } catch (err) {
      return err;
    }
  }

  async deleteWeighInById(id: string) {
    try {
      const result = await WeighIns.findOneAndUpdate(
        { "weighIns._id": id },
        { $pull: { weighIns: { _id: id } } },
        { new: true }
      );

      if (!result) {
        return null;
      }

      return result;
    } catch (err) {
      throw err;
    }
  }

  async deleteUserWeighIns(id: string) {
    try {
      const deletedWeighIns = await WeighIns.deleteOne({ userId: id });

      return deletedWeighIns;
    } catch (err) {
      return err;
    }
  }

  async updateWeighIn(weighInId: string, newWeighIn: any) {
    try {
      const updatedWeighIn = await WeighIns.updateOne(
        { "weighIns._id": weighInId },
        { $set: { "weighIns.$.weight": newWeighIn } }
      );

      return updatedWeighIn;
    } catch (err) {
      return err;
    }
  }
}
export const weighInServices = new WeighInService();
