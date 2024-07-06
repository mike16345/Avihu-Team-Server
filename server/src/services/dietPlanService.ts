import { DietPlan } from "../models/dietPlanModel";

export class DietPlanService {
  async addDietPlan(data: any) {
    try {
      const dietPlanDoc = await DietPlan.create(data);

      return dietPlanDoc;
    } catch (err: any) {
      console.error("Error adding diet plan:", err);
      throw new Error(`Failed to add diet plan: ${err.message}`);
    }
  }

  async getAllDietPlans() {
    try {
      const dietPlans = await DietPlan.find({});

      return dietPlans;
    } catch (err: any) {
      console.error("Error getting all diet plans:", err);
      throw new Error(`Failed to get all diet plans: ${err.message}`);
    }
  }

  async getDietPlanByUserId(userId: string) {
    try {
      const dietPlan = await DietPlan.findOne({ userId }).select({ _id: false, __v: false }).lean();

      return dietPlan;
    } catch (err: any) {
      console.error("Error getting diet plan by user ID:", err);
      throw new Error(`Failed to get diet plan by user ID: ${err.message}`);
    }
  }

  async deleteDietPlan(planId: string) {
    try {
      const deletedDietPlan = await DietPlan.findByIdAndDelete(planId);

      if (!deletedDietPlan) {
        throw new Error(`Diet plan not found for ID: ${planId}`);
      }

      return { message: "Diet plan successfully deleted" };
    } catch (err: any) {
      console.error("Error deleting diet plan:", err);
      throw new Error(`Failed to delete diet plan: ${err.message}`);
    }
  }

  async deleteDietPlanByUserId(userId: string) {
    try {
      const deletedDietPlan = await DietPlan.deleteOne({ userId });

      if (deletedDietPlan.deletedCount === 0) {
        throw new Error(`Diet plan not found for user ID: ${userId}`);
      }

      return { message: "Diet plan successfully deleted" };
    } catch (err: any) {
      console.error("Error deleting diet plan:", err);
      throw new Error(`Failed to delete diet plan: ${err.message}`);
    }
  }

  async updateDietPlanByUserId(userId: string, dietPlan: any) {
    try {
      const updatedDietPlan = await DietPlan.findOneAndUpdate({ userId }, dietPlan, {
        new: true,
      });

      return updatedDietPlan;
    } catch (err: any) {
      console.error("Error updating diet plan:", err);
      throw new Error(`Failed to update diet plan: ${err.message}`);
    }
  }

  async updateDietPlan(dietPlanId: string, newDietPlan: any) {
    try {
      const updatedDietPlan = await DietPlan.findByIdAndUpdate(dietPlanId, newDietPlan, {
        new: true,
      });

      if (!updatedDietPlan) {
        throw new Error(`Diet plan not found with ID: ${dietPlanId}`);
      }

      return updatedDietPlan;
    } catch (err: any) {
      console.error("Error updating diet plan:", err);
      throw new Error(`Failed to update diet plan: ${err.message}`);
    }
  }
}

export const DietPlanServices = new DietPlanService();
