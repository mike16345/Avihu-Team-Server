import { DietPlan } from "../models/dietPlanModel";

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
      const dietPlans = await DietPlan.find({});

      return dietPlans;
    } catch (err: any) {
      throw err;
    }
  }

  async getDietPlanById(planId: string) {
    try {
      const dietPlan = await DietPlan.findById(planId).select({ _id: false, __v: false }).lean();

      return dietPlan;
    } catch (err: any) {
      throw err;
    }
  }

  async getDietPlanByUserId(userId: string) {
    try {
      const dietPlan = await DietPlan.findOne({ userId }).select({ _id: false, __v: false }).lean();

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

      return updatedDietPlan || `Diet plan not found with ID: ${dietPlanId}`;
    } catch (err: any) {
      throw err;
    }
  }
}

export const DietPlanServices = new DietPlanService();
