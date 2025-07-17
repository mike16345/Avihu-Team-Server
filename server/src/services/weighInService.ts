import { WeighIns } from "../models/weighInModel";
import { IWeighIn, IWeighIns } from "../interfaces/IWeighIns";
import { Cache } from "../utils/cache";
import { HALF_DAY_IN_MILLISECONDS } from "../constants/Constants";
import { BaseService } from "./BaseService";
import WeighInsRepository from "../repositories/WeighIns/WeighInRepository";
import { StatusCode } from "../enums/StatusCode";

export default class WeighInService extends BaseService<IWeighIns, WeighInsRepository> {
  constructor() {
    super(new WeighInsRepository(), "weighIns");
  }

  async addWeighIn(data: any, userId: string) {
    const weighInsDoc = this.repository.addWeighIn(data, userId);

    return weighInsDoc;
  }

  async addManyWeighIns(data: IWeighIn[], id: string) {
    const weighInsDocs = await Promise.all(data.map((weighIn) => this.addWeighIn(weighIn, id)));

    return weighInsDocs;
  }

  async getWeighInsByUserId(id: string) {
    const cached = this.cache.get(id);

    if (cached) return cached.weighIns;
    const weighIns = await this.repository.findOne({ query: { userId: id } });

    if (!weighIns?.weighIns) return [];
    weighIns.weighIns = weighIns.weighIns.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    this.cache.set(id, weighIns, { expireAfter: HALF_DAY_IN_MILLISECONDS });

    return weighIns?.weighIns;
  }

  async updateWeighIn(weighInId: string, newWeighIn: any) {
    const parentDoc = await this.repository.findOne({ query: { "weighIns._id": weighInId } });

    // Find the index of the subdocument
    const subDocIndex = parentDoc.weighIns.findIndex(
      (item: any) => item._id.toString() === weighInId
    );

    if (subDocIndex === -1) {
      throw { message: "Subdocument not found", statusCode: StatusCode.NOT_FOUND };
    }
    // Update the specific subdocument
    parentDoc.weighIns[subDocIndex].weight = newWeighIn;
    await parentDoc.save();
    this.cache.invalidate(parentDoc.userId);

    // Return the updated subdocument
    return parentDoc.weighIns[subDocIndex];
  }
}
