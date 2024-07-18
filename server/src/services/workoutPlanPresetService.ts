import { WorkoutPlanPreset } from "../models/workoutPlanPresetModel";

export class WorkoutPlanPresetService {
  static async addWorkoutPreset(data: any) {
    try {
      const workoutPlanDoc = await WorkoutPlanPreset.create(data);

      return workoutPlanDoc;
    } catch (err) {
      throw err;
    }
  }
}
