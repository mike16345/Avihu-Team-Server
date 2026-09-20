import { IDietPlanPreset } from "../interfaces/IDietPlan";
import { IDietPlanPresetV2SaveRequest } from "../interfaces/IDietPlanV2";
import {
  AnyDietPlanPresetDocument,
  DietPlanPresetRepository,
} from "../repositories/Presets/DietPlanPresetRepository";
import { Types } from "mongoose";
import { BaseService } from "./baseService";
import { DietV2CatalogService } from "./dietV2CatalogService";
import { getAuthContext, requireTrainerAuthContext } from "../utils/authContext";
import { normalizeDietV2Name, normalizeDietV2Response } from "../utils/dietPlanV2";
import { StatusCode } from "../enums/StatusCode";

const baseKey = "diet-plan-preset";

export class DietPlanPresetsService extends BaseService<IDietPlanPreset, DietPlanPresetRepository> {
  private readonly catalogService: DietV2CatalogService;

  constructor() {
    super(new DietPlanPresetRepository(), baseKey);
    this.catalogService = new DietV2CatalogService();
  }

  private normalizeVersion = <T extends Record<string, any>>(preset: T) =>
    normalizeDietV2Response({
      ...preset,
      version: preset.version === 2 ? (2 as const) : (1 as const),
    });

  private getOwnership() {
    const { trainerId } = requireTrainerAuthContext();
    const actingUserId = getAuthContext()?.userId;

    if (!actingUserId || !Types.ObjectId.isValid(actingUserId)) {
      throw { status: StatusCode.UNAUTHORIZED, message: "Acting trainer is missing." };
    }

    return {
      trainerId: new Types.ObjectId(trainerId),
      builtByTrainerId: new Types.ObjectId(actingUserId),
    };
  }

  private async prepareV2Preset(request: IDietPlanPresetV2SaveRequest) {
    const ownership = this.getOwnership();
    const content = await this.catalogService.resolveContent(request);

    return {
      name: request.name.trim(),
      normalizedName: normalizeDietV2Name(request.name),
      ...ownership,
      ...content,
      ...(request.goal ? { goal: request.goal } : {}),
      ...(request.targetGender ? { targetGender: request.targetGender } : {}),
      ...(request.dietTags ? { dietTags: [...request.dietTags] } : {}),
    };
  }

  private prepareV1Preset(request: IDietPlanPreset) {
    const ownership = this.getOwnership();

    return {
      version: 1 as const,
      name: request.name.trim(),
      normalizedName: normalizeDietV2Name(request.name),
      trainerId: ownership.trainerId,
      builtByTrainerId: ownership.builtByTrainerId.toString(),
      meals: request.meals,
      supplements: request.supplements ?? [],
      ...(request.totalCalories !== undefined ? { totalCalories: request.totalCalories } : {}),
      ...(request.freeCalories !== undefined ? { freeCalories: request.freeCalories } : {}),
      ...(request.fatsPerDay !== undefined ? { fatsPerDay: request.fatsPerDay } : {}),
      ...(request.veggiesPerDay !== undefined ? { veggiesPerDay: request.veggiesPerDay } : {}),
      ...(request.customInstructions !== undefined
        ? { customInstructions: request.customInstructions }
        : {}),
      ...(request.goal !== undefined ? { goal: request.goal } : {}),
      ...(request.calories !== undefined ? { calories: request.calories } : {}),
      ...(request.proteinServings !== undefined
        ? { proteinServings: request.proteinServings }
        : {}),
      ...(request.carbServings !== undefined ? { carbServings: request.carbServings } : {}),
      ...(request.fatServings !== undefined ? { fatServings: request.fatServings } : {}),
      ...(request.dietaryRestrictions !== undefined
        ? { dietaryRestrictions: request.dietaryRestrictions }
        : {}),
    };
  }

  private async preparePreset(request: IDietPlanPreset | IDietPlanPresetV2SaveRequest) {
    return request.version === 2
      ? await this.prepareV2Preset(request as IDietPlanPresetV2SaveRequest)
      : this.prepareV1Preset(request as IDietPlanPreset);
  }

  async createPreset(request: IDietPlanPreset | IDietPlanPresetV2SaveRequest) {
    const prepared = await this.preparePreset(request);
    const created = await this.repository.createVersioned(prepared);

    this.cache.invalidateAll();

    return this.normalizeVersion(created as unknown as Record<string, any>);
  }

  async listPresets(version: 1 | 2) {
    const presets = await this.repository.findByVersion(version);

    return presets.map((preset) => this.normalizeVersion(preset as unknown as Record<string, any>));
  }

  async getPresetById(id: string) {
    const preset = await this.repository.findScopedById(id);

    return preset ? this.normalizeVersion(preset as unknown as Record<string, any>) : null;
  }

  async replacePresetById(id: string, request: IDietPlanPreset | IDietPlanPresetV2SaveRequest) {
    const existing = await this.repository.findScopedById(id);

    if (!existing) return null;

    const prepared = await this.preparePreset(request);
    const updated = await this.repository.replaceScopedById(id, prepared);

    this.cache.invalidateAll();

    return updated ? this.normalizeVersion(updated as unknown as Record<string, any>) : null;
  }

  async deletePresetById(id: string) {
    const deleted = await this.repository.deleteScopedById(id);

    this.cache.invalidateAll();

    return deleted ? this.normalizeVersion(deleted as unknown as Record<string, any>) : null;
  }
}
