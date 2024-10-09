import { WeighIns } from "../models/weighInModel";
import { IWeighIn, IWeighIns } from "../interfaces/IWeighIns";
import { Cache } from "../utils/cache";
import { HALF_DAY_IN_MILLISECONDS } from "../constants/Constants";

let weighInsCache = new Cache<IWeighIns>();

export class WeighInService {
  async addWeighIn(data: any, userId: string) {
    try {
      const { date, weight } = data;

      const weighInsDoc = await WeighIns.findOneAndUpdate(
        { userId },
        { $push: { weighIns: { date, weight } } },
        { new: true, upsert: true }
      );
      weighInsCache.invalidate(userId);

      return weighInsDoc;
    } catch (err) {
      throw err;
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
    let sorted: IWeighIn[] = [];
    try {
      const cached = weighInsCache.get(id);
      const weighIns = cached || (await WeighIns.findOne({ userId: id }));
      if (weighIns?.weighIns && !cached) {
        sorted = weighIns.weighIns.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        weighIns.weighIns = sorted;
        weighInsCache.set(id, weighIns, { expireAfter: HALF_DAY_IN_MILLISECONDS });
      }

      return weighIns?.weighIns;
    } catch (err) {
      throw err;
    }
  }

  async getWeighInsById(id: string) {
    const cached = weighInsCache.get(id);

    try {
      const weighIns = cached || (await WeighIns.findOne({ id }));
      weighInsCache.set(weighIns?.userId, weighIns);

      return weighIns?.weighIns;
    } catch (err) {
      throw err;
    }
  }

  async deleteWeighInById(id: string) {
    try {
      const result = await WeighIns.findOneAndUpdate(
        { "weighIns._id": id },
        { $pull: { weighIns: { _id: id } } },
        { new: true }
      );

      weighInsCache.invalidate(result?.userId);

      return result;
    } catch (err) {
      throw err;
    }
  }

  async deleteUserWeighIns(id: string) {
    try {
      const deletedWeighIns = await WeighIns.deleteOne({ userId: id });
      weighInsCache.invalidate(id);

      return deletedWeighIns;
    } catch (err) {
      throw err;
    }
  }
  async updateWeighIn(weighInId: string, newWeighIn: any) {
    try {
      // Find the parent document containing the subdocument
      const parentDoc = await WeighIns.findOne({ "weighIns._id": weighInId });

      if (!parentDoc) {
        throw new Error("Weigh-in not found");
      }

      // Find the index of the subdocument
      const subDocIndex = parentDoc.weighIns.findIndex(
        (item: any) => item._id.toString() === weighInId
      );

      if (subDocIndex === -1) {
        throw new Error("Subdocument not found");
      }

      // Update the specific subdocument
      parentDoc.weighIns[subDocIndex].weight = newWeighIn;
      await parentDoc.save();
      weighInsCache.invalidate(parentDoc.userId);

      // Return the updated subdocument
      return parentDoc.weighIns[subDocIndex];
    } catch (err) {
      throw err;
    }
  }
}
export const weighInServices = new WeighInService();
