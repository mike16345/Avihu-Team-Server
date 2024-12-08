import { WorkoutPlanPreset } from "../models/workoutPlanPresetModel";
import { Cache } from "../utils/cache";

const workoutPlanCache = new Cache<any>();

export class WorkoutPlanPresetService {
  static async addWorkoutPlanPreset(data: any) {
    try {
      const workoutPlanDoc = await WorkoutPlanPreset.create(data);
      workoutPlanCache.invalidateAll();
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

      workoutPlanCache.invalidate(presetId);
      workoutPlanCache.invalidate("all");

      return result;
    } catch (err) {
      throw err;
    }
  }

  static async deleteWorkoutPlanPreset(presetId: string) {
    try {
      const workoutPlanDoc = await WorkoutPlanPreset.findByIdAndDelete(presetId);

      if (workoutPlanDoc) {
        workoutPlanCache.invalidate(presetId); // Invalidate cache for the deleted preset
        workoutPlanCache.invalidate("all"); // Optionally invalidate all presets cache
      }

      return workoutPlanDoc;
    } catch (err) {
      throw err;
    }
  }

  static async getAllWorkoutPlanPresets() {
    const cachedPresets = workoutPlanCache.get("all");
    if (cachedPresets) {
      return cachedPresets;
    }

    try {
      const workoutPlanPresets = await WorkoutPlanPreset.find();
      workoutPlanCache.set("all", workoutPlanPresets);
      return workoutPlanPresets;
    } catch (err) {
      throw err;
    }
  }

  static async getWorkoutPlanPresetById(id: string) {
    const cachedPreset = workoutPlanCache.get(id);
    if (cachedPreset) {
      return cachedPreset;
    }

    try {
      const workoutPlanPreset = await WorkoutPlanPreset.findById(id);
      if (workoutPlanPreset) {
        workoutPlanCache.set(id, workoutPlanPreset); // Cache the preset by ID
      }

      return workoutPlanPreset;
    } catch (err) {
      throw err;
    }
  }
}
