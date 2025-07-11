import { FilterQuery } from "mongoose";
import {  IDietPlan } from "../../interfaces/IDietPlan";
import { DietPlan } from "../../models/dietPlanModel";
import { BaseRepository } from "../BaseRepository";
import { fullMenuItemPresets } from "../../models/menuItemModel";
import { FIND_FAILURE } from "../../constants/repository";

export class DietPlanRepository extends BaseRepository<IDietPlan> {
  constructor() {
    super(DietPlan);
  }

  getPopulatedDietPlan=async(query:FilterQuery<IDietPlan>)=>{
       let data = await this.model.find(query).select({ _id: false, __v: false }).populate({ path: "meals.totalProtein.customItems",
                 model: fullMenuItemPresets}).populate({
                  path: "meals.totalCarbs.customItems",
                  model: fullMenuItemPresets,
                });;
    
        if (!data) throw new Error(FIND_FAILURE);
    
        return data;
  }
}
