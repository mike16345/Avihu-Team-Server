import { IDietPlanPreset } from "../interfaces/IDietPlan";
import { DietPlanPresetsModel } from "../models/dietPlanPresetModel";
import { Cache } from "../utils/cache";

const cachedDietPlanPresets = new Cache<any>();

export class DietPlanPresetsService {
  static async addDietPlanPreset(preset: IDietPlanPreset) {
    try {
      const newDietPlanPreset = await DietPlanPresetsModel.create(preset);
      cachedDietPlanPresets.invalidateAll();

      return newDietPlanPreset;
    } catch (err: any) {
      throw err;
    }
  }

  static async getAllDietPlanPresets() {
    const cached = cachedDietPlanPresets.get("all");

    try {
      const dietPlanPresets = cached || (await DietPlanPresetsModel.find({}));
      cachedDietPlanPresets.set("all", dietPlanPresets);

      return dietPlanPresets;
    } catch (err: any) {
      throw err;
    }
  }

  static async getDietPlanPresetById(id: string) {
    const cached = cachedDietPlanPresets.get(id);

    try {
      const dietPlanPreset =
        cached ||
        (await DietPlanPresetsModel.findById(id).select({
          _id: false,
          __v: false,
        }));

      cachedDietPlanPresets.set(id, dietPlanPreset);
      return dietPlanPreset;
    } catch (err: any) {
      throw err;
    }
  }

  static async updateDietPlanPreset(id: string, dietPlanPreset: IDietPlanPreset) {
    try {
      const updatedDietPlanPreset = await DietPlanPresetsModel.findByIdAndUpdate(
        id,
        dietPlanPreset,
        {
          new: true,
        }
      );

      if (updatedDietPlanPreset) {
        cachedDietPlanPresets.invalidate("all");
        cachedDietPlanPresets.invalidate(id);
      }

      return updatedDietPlanPreset;
    } catch (err: any) {
      throw err;
    }
  }

  static async deleteDietPlanPreset(id: string) {
    try {
      const result = await DietPlanPresetsModel.findByIdAndDelete(id);

      if (result) {
        cachedDietPlanPresets.invalidate("all");
        cachedDietPlanPresets.invalidate(id);
      }

      return result;
    } catch (err: any) {
      throw err;
    }
  }
}
