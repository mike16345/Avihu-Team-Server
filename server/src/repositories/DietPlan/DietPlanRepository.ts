import { FilterQuery, Types } from "mongoose";
import { IDietPlan } from "../../interfaces/IDietPlan";
import { DietPlan } from "../../models/dietPlanModel";
import { BaseRepository } from "../BaseRepository";
import { fullMenuItemPresets } from "../../models/menuItemModel";
import { IDietPlanV2Document } from "../../interfaces/IDietPlanV2";
import { DietPlanV2Model } from "../../models/dietPlanV2Schemas";

export type AnyDietPlanDocument = IDietPlan | IDietPlanV2Document;

export class DietPlanRepository extends BaseRepository<IDietPlan> {
  constructor() {
    super(DietPlan, { type: "global" });
  }

  getPopulatedDietPlan = async (query: FilterQuery<IDietPlan>) => {
    let data = await this.model
      .findOne(query)
      .select({ __v: false })
      .populate([
        { path: "meals.totalProtein.customItems", model: fullMenuItemPresets },
        { path: "meals.totalCarbs.customItems", model: fullMenuItemPresets },
        { path: "meals.totalFats.customItems", model: fullMenuItemPresets },
        { path: "meals.totalVeggies.customItems", model: fullMenuItemPresets },
      ])
      .lean();

    return data;
  };

  findActiveByUserId = async (userId: string) => {
    return await DietPlan.collection.findOne({ userId });
  };

  findActiveById = async (planId: string) => {
    if (!Types.ObjectId.isValid(planId)) return null;

    return await DietPlan.collection.findOne({ _id: new Types.ObjectId(planId) });
  };

  replaceActiveByUserId = async (
    userId: string,
    replacement: AnyDietPlanDocument
  ): Promise<AnyDietPlanDocument> => {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true } as const;
    const updated =
      replacement.version === 2
        ? await DietPlanV2Model.findOneAndReplace(
            { userId },
            replacement as IDietPlanV2Document,
            options
          ).lean()
        : await DietPlan.findOneAndReplace({ userId }, replacement as IDietPlan, options).lean();

    return updated as unknown as AnyDietPlanDocument;
  };

  updateLegacyTotalCalories = async (planId: string, totalCalories: number) => {
    if (!Types.ObjectId.isValid(planId)) return null;

    return await DietPlan.findOneAndUpdate(
      { _id: new Types.ObjectId(planId), version: { $ne: 2 } },
      { $set: { totalCalories } },
      { new: true, lean: true }
    );
  };

  deleteActiveByUserId = async (userId: string) => {
    return await DietPlan.collection.findOneAndDelete({ userId });
  };

  deleteActiveById = async (planId: string) => {
    if (!Types.ObjectId.isValid(planId)) return null;

    return await DietPlan.collection.findOneAndDelete({ _id: new Types.ObjectId(planId) });
  };
}
