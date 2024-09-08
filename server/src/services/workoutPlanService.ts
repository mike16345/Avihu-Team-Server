import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import { WorkoutPlan } from "../models/workoutPlanModel";
import { Cache } from "../utils/cache";

let workoutPlansCache = new Cache<IFullWorkoutPlan>();
let allWorkoutPlansCache = new Cache<IFullWorkoutPlan[]>();

export class WorkoutPlanService {
  async addWorkoutPlan(data: any) {
    try {
      const workoutPlanDoc = await WorkoutPlan.create(data);
      workoutPlansCache.invalidate(workoutPlanDoc.userId);

      return workoutPlanDoc;
    } catch (err) {
      throw err;
    }
  }

  async getAllWorkoutPlans() {
    try {
      const cachedPlans = allWorkoutPlansCache.get("all");
      const workoutPlans = cachedPlans || (await WorkoutPlan.find().lean());
      allWorkoutPlansCache.set("all", workoutPlans);

      return workoutPlans;
    } catch (err) {
      throw err;
    }
  }

  async getWorkoutPlanById(id: string) {
    const cached = workoutPlansCache.get(id);

    try {
      const workoutPlan = cached || (await WorkoutPlan.findById(id));
      workoutPlansCache.set(id, workoutPlan);

      return workoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async getWorkoutPlanByUserId(userId: string) {
    const cached = workoutPlansCache.get(userId);

    try {
      const workoutPlan = cached || (await WorkoutPlan.findOne({ userId }));
      workoutPlansCache.set(userId, workoutPlan);

      return workoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async deleteWorkoutPlanById(id: string) {
    try {
      const deletedWorkoutPlan = await WorkoutPlan.findByIdAndDelete(id);
      allWorkoutPlansCache.invalidateAll();
      workoutPlansCache.invalidateAll();

      return deletedWorkoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async updateWorkoutPlan(id: string, updatedData: any) {
    try {
      const updatedWorkoutPlan = await WorkoutPlan.findByIdAndUpdate(id, updatedData, {
        new: true,
      });

      allWorkoutPlansCache.invalidateAll();
      workoutPlansCache.invalidate(updatedWorkoutPlan?.userId || "");
      workoutPlansCache.invalidate(id);

      return updatedWorkoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async updateWorkoutPlanByUserId(id: string, updatedData: any) {
    try {
      console.log("searching for workout plan to update", id);
      const workoutPlan = await WorkoutPlan.findOne({ userId: id });
      if (!workoutPlan) return null;
      Object.assign(workoutPlan, updatedData);
      console.log("updated workout plan ", workoutPlan);
      allWorkoutPlansCache.invalidateAll();
      workoutPlansCache.invalidate(String(workoutPlan?._id || ""));
      workoutPlansCache.invalidate(id);
      console.log("invalidated cache");
      await workoutPlan.save();
      return workoutPlan;
    } catch (err) {
      throw err;
    }
  }
}

export const workoutPlanService = new WorkoutPlanService();
