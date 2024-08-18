import { WorkoutPlan } from "../models/workoutPlanModel";

export class WorkoutPlanService {
  async addWorkoutPlan(data: any) {
    try {
      const workoutPlanDoc = await WorkoutPlan.create(data);

      return workoutPlanDoc;
    } catch (err) {
      throw err;
    }
  }

  async getAllWorkoutPlans() {
    try {
      const workoutPlans = await WorkoutPlan.find({}).lean();

      return workoutPlans;
    } catch (err) {
      throw err;
    }
  }

  async getWorkoutPlanById(id: string) {
    try {
      const workoutPlan = await WorkoutPlan.findById(id);
      return workoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async getWorkoutPlanByUserId(userId: string) {
    try {
      const workoutPlan = await WorkoutPlan.findOne({ userId });

      return workoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async deleteWorkoutPlanById(id: string) {
    try {
      const deletedWorkoutPlan = await WorkoutPlan.findByIdAndDelete(id);

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

      return updatedWorkoutPlan;
    } catch (err) {
      throw err;
    }
  }

  async updateWorkoutPlanByUserId(id: string, updatedData: any) {
    try {
      const updatedWorkoutPlan = await WorkoutPlan.findOneAndUpdate({ userId: id }, updatedData, {
        new: true,
      });

      return updatedWorkoutPlan;
    } catch (err) {
      throw err;
    }
  }
}

export const workoutPlanService = new WorkoutPlanService();
