import { FilterQuery, Types } from "mongoose";
import { IDietPlan } from "../interfaces/IDietPlan";
import {
  AnyDietPlanDocument,
  DietPlanRepository,
} from "../repositories/DietPlan/DietPlanRepository";
import { stableStringify } from "../utils/utils";
import { BaseService } from "./baseService";
import { IDietPlanV2SaveRequest } from "../interfaces/IDietPlanV2";
import { DietV2CatalogService, getDietV2CatalogKey } from "./dietV2CatalogService";
import { normalizeDietV2Name } from "../utils/dietPlanV2";
import { calculateTotalCalories } from "../utils/dietPlan";
import UserRepository from "../repositories/User/UserRepository";
import { getAuthContext, requireTrainerAuthContext } from "../utils/authContext";
import { StatusCode } from "../enums/StatusCode";

const baseKey = "diet-plan";

export class DietPlanService extends BaseService<IDietPlan, DietPlanRepository> {
  private readonly catalogService: DietV2CatalogService;
  private readonly userRepository: UserRepository;

  constructor() {
    super(new DietPlanRepository(), baseKey);
    this.catalogService = new DietV2CatalogService();
    this.userRepository = new UserRepository();
  }

  protected getLegacyDietPlan = async (query: FilterQuery<IDietPlan>, populate: boolean) => {
    if (!populate) return await this.findOne(query);
    const key = this.generateCacheKey("one", stableStringify({ ...query, populate }));
    const cached = this.cache.get(key);

    if (cached) return cached;
    const dietPlan = await this.repository.getPopulatedDietPlan(query);
    this.cache.set(key, dietPlan);

    return dietPlan;
  };

  private normalizeVersion = <T extends Record<string, any>>(plan: T): T & { version: 1 | 2 } => ({
    ...plan,
    version: plan.version === 2 ? 2 : 1,
  });

  private async assertCanAccessUser(userId: string, write: boolean = false): Promise<void> {
    const authContext = getAuthContext();

    if (!authContext) {
      throw { status: StatusCode.UNAUTHORIZED, message: "Auth context missing" };
    }

    if (authContext.role === "user") {
      if (write || authContext.userId !== userId) {
        throw { status: StatusCode.NOT_FOUND, message: "Trainee not found." };
      }
      return;
    }

    requireTrainerAuthContext();

    if (!Types.ObjectId.isValid(userId)) {
      throw { status: StatusCode.NOT_FOUND, message: "Trainee not found." };
    }

    await this.userRepository.findOne({
      query: { _id: new Types.ObjectId(userId), role: "user" } as any,
    });
  }

  private async prepareV2Plan(request: IDietPlanV2SaveRequest) {
    const { trainerId } = requireTrainerAuthContext();
    const candidates = request.meals.flatMap((meal) => [
      ...meal.categories.flatMap((category) =>
        category.items.map((item) => ({ category: category.category, name: item.name }))
      ),
      ...(meal.freeCalories?.description.trim()
        ? [{ category: "freeCalories" as const, name: meal.freeCalories.description }]
        : []),
    ]);
    const resolved = await this.catalogService.resolveAndTouch(candidates);
    const meals = request.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      categories: meal.categories.map((category) => ({
        category: category.category,
        items: category.items.map((item) => {
          const key = getDietV2CatalogKey(
            category.category,
            normalizeDietV2Name(item.name)
          );
          const catalogItem = resolved.get(key);

          if (!catalogItem?._id) {
            throw {
              status: StatusCode.INTERNAL_SERVER_ERROR,
              message: `Could not resolve catalog item: ${item.name}`,
            };
          }

          return { name: item.name.trim(), catalogItemId: catalogItem._id };
        }),
      })),
      macros: {
        calories: meal.macros.calories,
        protein: meal.macros.protein,
        carbs: meal.macros.carbs,
        fat: meal.macros.fat,
      },
      ...(meal.freeCalories
        ? {
            freeCalories: {
              calories: meal.freeCalories.calories,
              description: meal.freeCalories.description.trim(),
            },
          }
        : {}),
      ...(meal.supplements ? { supplements: [...meal.supplements] } : {}),
    }));

    return {
      userId: request.userId,
      trainerId: new Types.ObjectId(trainerId),
      version: 2 as const,
      meals,
      highlights: request.highlights,
    };
  }

  private prepareV1Plan(request: IDietPlan) {
    return {
      userId: request.userId,
      version: 1 as const,
      meals: request.meals,
      supplements: request.supplements ?? [],
      ...(request.customInstructions !== undefined
        ? { customInstructions: request.customInstructions }
        : {}),
      ...(request.freeCalories !== undefined ? { freeCalories: request.freeCalories } : {}),
      ...(request.fatsPerDay !== undefined ? { fatsPerDay: request.fatsPerDay } : {}),
      ...(request.veggiesPerDay !== undefined ? { veggiesPerDay: request.veggiesPerDay } : {}),
      totalCalories: calculateTotalCalories(request.meals, request.freeCalories),
    };
  }

  saveActivePlan = async (request: IDietPlan | IDietPlanV2SaveRequest) => {
    await this.assertCanAccessUser(request.userId, true);
    const replacement =
      request.version === 2
        ? await this.prepareV2Plan(request as IDietPlanV2SaveRequest)
        : this.prepareV1Plan(request as IDietPlan);
    const saved = await this.repository.replaceActiveByUserId(request.userId, replacement);

    this.cache.invalidateAll();

    return this.normalizeVersion(saved as unknown as Record<string, any>);
  };

  repairLegacyTotalCalories = async (planId: string, totalCalories: number) => {
    const repaired = await this.repository.updateLegacyTotalCalories(planId, totalCalories);

    this.cache.invalidateAll();

    return repaired;
  };

  deleteActiveByUserId = async (userId: string) => {
    await this.assertCanAccessUser(userId, true);
    const deleted = await this.repository.deleteActiveByUserId(userId);

    this.cache.invalidateAll();

    return deleted;
  };

  deleteActiveById = async (planId: string) => {
    const plan = await this.repository.findActiveById(planId);

    if (!plan) return null;

    await this.assertCanAccessUser(plan.userId, true);
    const deleted = await this.repository.deleteActiveById(planId);

    this.cache.invalidateAll();

    return deleted;
  };

  getDietPlanById = async (planId: string, populate: boolean = true) => {
    const raw = await this.repository.findActiveById(planId);

    if (!raw) return null;

    await this.assertCanAccessUser(raw.userId);

    if (raw.version === 2 || !populate) {
      return this.normalizeVersion(raw as Record<string, any>);
    }

    const populated = await this.getLegacyDietPlan({ _id: planId }, true);

    return populated ? this.normalizeVersion(populated as any) : null;
  };

  async getDietPlanByUserId(userId: string, populate: boolean = true) {
    await this.assertCanAccessUser(userId);
    const raw = await this.repository.findActiveByUserId(userId);

    if (!raw) return null;

    if (raw.version === 2 || !populate) {
      return this.normalizeVersion(raw as Record<string, any>);
    }

    const populated = await this.getLegacyDietPlan({ userId }, true);

    return populated ? this.normalizeVersion(populated as any) : null;
  }
}
