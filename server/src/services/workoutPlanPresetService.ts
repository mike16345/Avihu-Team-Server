import { WorkoutPlanPreset } from "../models/workoutPlanPresetModel";

export class WorkoutPlanPresetService {
  static async addWorkoutPlanPreset(data: any) {
    try {
      console.log("creating with data", data);
      const workoutPlanDoc = await WorkoutPlanPreset.create(data);
      console.log("result", workoutPlanDoc);
      
      return workoutPlanDoc;
    } catch (err) {
      throw err;
    }
  }

  static async updateWorkoutPlanPreset(presetId: string, data: any) {
    try {
      const workoutPlanDoc = await WorkoutPlanPreset.findById(presetId);
      
      if (!workoutPlanDoc) {
        return null;
      }

      Object.assign(workoutPlanDoc, data);

      const result = await workoutPlanDoc.save();

      return result;
    } catch (err) {
      throw err;
    }
  }

  static async deleteWorkoutPlanPreset(presetId: string) {
    try {
      const workoutPlanDoc = await WorkoutPlanPreset.findByIdAndDelete(presetId);

      return workoutPlanDoc;
    } catch (err) {
      throw err;
    }
  }

  static async getAllWorkoutPlanPresets() {
    try {
      const workoutPlanPresets = await WorkoutPlanPreset.find({});

      return workoutPlanPresets;
    } catch (err) {
      throw err;
    }
  }
}
