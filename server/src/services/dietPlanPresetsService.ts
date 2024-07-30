import { Request, Response } from "express";
import { IDietPlanPreset } from "../interfaces/IDietPlan";
import { DietPlanPresetsModel } from "../models/dietPlanPresetModel";

export class DietPlanPresetsService {
  static async addDietPlanPreset(preset: IDietPlanPreset) {
    try {
      const newDietPlanPreset = await DietPlanPresetsModel.create(preset);

      return newDietPlanPreset;
    } catch (err: any) {
      throw err;
    }
  }

  static async getAllDietPlanPresets() {
    try {
      const dietPlanPresets = await DietPlanPresetsModel.find({});

      return dietPlanPresets;
    } catch (err: any) {
      throw err;
    }
  }

  static async getDietPlanPresetById(id: string) {
    try {
      const dietPlanPreset = await DietPlanPresetsModel.findById(id);

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
      
      return updatedDietPlanPreset;
    } catch (err: any) {
      throw err;
    }
  }

  static async deleteDietPlanPreset(id: string) {
    try {
      const result = await DietPlanPresetsModel.findByIdAndDelete(id);

      return result;
    } catch (err: any) {
      throw err;
    }
  }
}
