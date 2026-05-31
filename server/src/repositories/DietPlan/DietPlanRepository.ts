import { FilterQuery } from "mongoose";
import { IDietPlan } from "../../interfaces/IDietPlan";
import { DietPlan } from "../../models/dietPlanModel";
import { BaseRepository } from "../BaseRepository";
import { fullMenuItemPresets } from "../../models/menuItemModel";

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
}
