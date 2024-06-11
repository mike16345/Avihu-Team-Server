import { WeighIns } from "../models/weighInModel";

export class WeighInService {
  async addWeighIn(data: any) {
    try {
      const { userId, date, weight } = data;

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

  async getWeightInsByUserId(id: string) {
    try {
      const weighIns = await WeighIns.findOne({ id });

      return weighIns;
    } catch (err) {
      return err;
    }
  }

  async deleteWeighIns(id: string) {
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

      console.log("updated");

      return updatedWeighIn;
    } catch (err) {
      return err;
    }
  }
}
export const weighInServices = new WeighInService();
