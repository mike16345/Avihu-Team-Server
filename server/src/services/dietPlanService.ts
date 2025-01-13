import { DietPlan } from "../models/dietPlanModel";
import { fullMenuItemPresets } from "../models/menuItemModel";
import { Cache } from "../utils/cache";

let cachedDietPlans = new Cache<any>();
const getDietPlan = async (filter: { _id?: string; userId?: string }, populate: boolean = true) => {
  if (!filter._id && !filter.userId) throw new Error("Missing required id or userId parameter");

  const cacheKey = filter._id || filter.userId;
  const cached = cachedDietPlans.get(cacheKey! + populate.valueOf());

  try {
    const query = DietPlan.findOne(filter).select({ _id: false, __v: false });

    if (populate) {
      query
        .populate({
          path: "meals.totalProtein.customItems",
          model: fullMenuItemPresets,
        })
        .populate({
          path: "meals.totalCarbs.customItems",
          model: fullMenuItemPresets,
        });
    }

    const dietPlan = cached || (await query.lean());
    cachedDietPlans.set(cacheKey!, dietPlan);

    return dietPlan;
  } catch (err: any) {
    throw err;
  }
};

export class DietPlanService {
  async addDietPlan(data: any) {
    try {
      const dietPlanDoc = await DietPlan.create(data);
      cachedDietPlans.invalidateAll();

      return dietPlanDoc;
    } catch (err: any) {
      throw err;
    }
  }

  async getAllDietPlans() {
    const cached = cachedDietPlans.get("all");

    try {
      const dietPlans = cached || (await DietPlan.find({}));
      cachedDietPlans.set("all", dietPlans);

      return dietPlans;
    } catch (err: any) {
      throw err;
    }
  }

  async getDietPlanById(planId: string, populate: boolean = true) {
    try {
      return getDietPlan({ _id: planId }, populate);
    } catch (error) {
      throw error;
    }
  }

  async getDietPlanByUserId(userId: string, populate: boolean = true) {
    try {
      return getDietPlan({ userId }, populate);
    } catch (error) {
      throw error;
    }
  }

  async deleteDietPlan(planId: string) {
    try {
      const deletedDietPlan = await DietPlan.findByIdAndDelete(planId);
      if (deletedDietPlan) {
        cachedDietPlans.invalidate("all");
        cachedDietPlans.invalidate(deletedDietPlan.userId);
        cachedDietPlans.invalidate(String(deletedDietPlan._id));
      }

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
      cachedDietPlans.invalidate("all");
      cachedDietPlans.invalidate(deletedDietPlan.userId);
      cachedDietPlans.invalidate(String(deletedDietPlan._id));

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
        cachedDietPlans.invalidate("all");
        cachedDietPlans.invalidate(userId);
        cachedDietPlans.invalidate(String(updatedDietPlan._id));
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

      if (updatedDietPlan) {
        cachedDietPlans.invalidate("all");
        cachedDietPlans.invalidate(updatedDietPlan.userId);
        cachedDietPlans.invalidate(dietPlanId);
      }

      return updatedDietPlan;
    } catch (err: any) {
      throw err;
    }
  }
}

export const DietPlanServices = new DietPlanService();
