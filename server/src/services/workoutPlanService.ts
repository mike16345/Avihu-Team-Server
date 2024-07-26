import { WorkoutPlan } from "../models/workoutPlanModel";

export class WorkoutPlanService {
  async addWorkoutPlan(data: any) {
    try {
      console.log("data", data);
      const workoutPlanDoc = await WorkoutPlan.create(data);

      return workoutPlanDoc;
    } catch (err) {
      return err;
    }
  }

  async getAllWorkoutPlans() {
    try {
      const workoutPlans = await WorkoutPlan.find({}).lean();

      return workoutPlans;
    } catch (err) {
      return err;
    }
  }

  async getWorkoutPlanById(id: string) {
    try {
      const workoutPlan = await WorkoutPlan.findById(id);
      return workoutPlan;
    } catch (err) {
      return err;
    }
  }

  async getWorkoutPlanByUserId(userId: string) {
    try {
      const workoutPlan = await WorkoutPlan.findOne({ userId });

      return workoutPlan;
    } catch (err) {
      return err;
    }
  }

  async deleteWorkoutPlanById(id: string) {
    try {
      const deletedWorkoutPlan = await WorkoutPlan.findByIdAndDelete(id);

      return deletedWorkoutPlan;
    } catch (err) {
      return err;
    }
  }

  async updateWorkoutPlan(id: string, updatedData: any) {
    try {
      const updatedWorkoutPlan = await WorkoutPlan.findByIdAndUpdate(id, updatedData, {
        new: true,
      });

      return updatedWorkoutPlan;
    } catch (err) {
      return err;
    }
  }

  async updateWorkoutPlanByUserId(id: string, updatedData: any) {
    try {
      const updatedWorkoutPlan = await WorkoutPlan.findOneAndUpdate({ userId: id }, updatedData, {
        new: true,
      });

      return updatedWorkoutPlan;
    } catch (err) {
      return err;
    }
  }
}

export const workoutPlanService = new WorkoutPlanService();
