import { IDietPlan } from "../interfaces/IDietPlan";
import { DietPlan } from "../models/dietPlanModel";

let dietPlansCache: IDietPlan[] | null = null;
let dietPlanCache: { [id: string]: IDietPlan | null } = {};

export class DietPlanService {
  async addDietPlan(data: any) {
    try {
      const dietPlanDoc = await DietPlan.create(data);

      return dietPlanDoc;
    } catch (err: any) {
      throw err;
    }
  }

  async getAllDietPlans() {
    try {
      if (dietPlansCache) return dietPlansCache;
      const dietPlans = await DietPlan.find({});
      dietPlansCache = dietPlans;

      return dietPlans;
    } catch (err: any) {
      throw err;
    }
  }

  async getDietPlanById(planId: string) {
    try {
      if (dietPlanCache[planId]) return dietPlanCache[planId];

      const dietPlan = await DietPlan.findById(planId).select({ _id: false, __v: false }).lean();
      dietPlanCache[planId] = dietPlan;

      return dietPlan;
    } catch (err: any) {
      throw err;
    }
  }

  async getDietPlanByUserId(userId: string) {
    try {
      if (dietPlanCache[userId]) return dietPlanCache[userId];

      const dietPlan = await DietPlan.findOne({ userId }).select({ _id: false, __v: false }).lean();
      dietPlanCache[userId] = dietPlan;

      return dietPlan;
    } catch (err: any) {
      throw err;
    }
  }

  async deleteDietPlan(planId: string) {
    try {
      const deletedDietPlan = await DietPlan.findByIdAndDelete(planId);

      return deletedDietPlan || `Diet plan not found for ID: ${planId}`;
    } catch (err: any) {
      throw err;
    }
  }

  async deleteDietPlanByUserId(userId: string) {
    try {
      const deletedDietPlan = await DietPlan.findOneAndDelete({ userId: userId });

      if (!deletedDietPlan) {
        return `Diet plan not found/deleted for user ID: ${userId}`;
      }

      dietPlanCache[userId] = null;
      return deletedDietPlan;
    } catch (err: any) {
      throw err;
    }
  }

  async updateDietPlanByUserId(userId: string, dietPlan: any) {
    try {
      const updatedDietPlan = await DietPlan.findOneAndUpdate({ userId }, dietPlan, {
        new: true,
      });

      if (updatedDietPlan) {
        dietPlanCache[userId] = updatedDietPlan;
      }

      return updatedDietPlan;
    } catch (err: any) {
      throw err;
    }
  }

  async updateDietPlan(dietPlanId: string, newDietPlan: any) {
    try {
      const updatedDietPlan = await DietPlan.findByIdAndUpdate(dietPlanId, newDietPlan, {
        new: true,
      });

      return updatedDietPlan;
    } catch (err: any) {
      throw err;
    }
  }
}

export const DietPlanServices = new DietPlanService();
