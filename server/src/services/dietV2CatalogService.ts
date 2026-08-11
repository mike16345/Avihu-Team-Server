import {
  DietV2PopularItems,
  IDietV2CatalogCandidate,
  IDietV2CatalogItem,
  IDietV2NormalizedCatalogCandidate,
} from "../interfaces/IDietV2CatalogItem";
import { DietV2CatalogCategory } from "../interfaces/IDietPlanV2";
import { IDietPlanV2Content } from "../interfaces/IDietPlanV2";
import { DietV2CatalogRepository } from "../repositories/MenuItems/DietV2CatalogRepository";
import { normalizeDietV2Name } from "../utils/dietPlanV2";
import { BaseService } from "./baseService";

const SEARCH_LIMIT = 12;
const POPULAR_LIMIT = 6;

export const getDietV2CatalogKey = (
  category: DietV2CatalogCategory,
  normalizedName: string
): string => `${category}:${normalizedName}`;

export class DietV2CatalogService extends BaseService<
  IDietV2CatalogItem,
  DietV2CatalogRepository
> {
  constructor() {
    super(new DietV2CatalogRepository(), "diet-v2-catalog");
  }

  async resolveAndTouch(
    candidates: IDietV2CatalogCandidate[]
  ): Promise<Map<string, IDietV2CatalogItem>> {
    const distinct = new Map<string, IDietV2NormalizedCatalogCandidate>();

    for (const candidate of candidates) {
      const normalizedName = normalizeDietV2Name(candidate.name);

      if (!normalizedName) continue;

      const key = getDietV2CatalogKey(candidate.category, normalizedName);

      if (!distinct.has(key)) {
        distinct.set(key, {
          category: candidate.category,
          name: candidate.name.trim(),
          normalizedName,
        });
      }
    }

    const normalizedCandidates = [...distinct.values()];

    if (normalizedCandidates.length === 0) return new Map();

    await this.repository.upsertAndTouch(normalizedCandidates, new Date());
    const items = await this.repository.findByCandidates(normalizedCandidates);
    const resolved = new Map<string, IDietV2CatalogItem>();

    for (const item of items) {
      resolved.set(getDietV2CatalogKey(item.category, item.normalizedName), item);
    }

    this.cache.invalidateAll();

    return resolved;
  }

  async resolveContent(content: IDietPlanV2Content): Promise<IDietPlanV2Content> {
    const candidates = content.meals.flatMap((meal) => [
      ...meal.categories.flatMap((category) =>
        category.items.map((item) => ({ category: category.category, name: item.name }))
      ),
      ...(meal.freeCalories?.description.trim()
        ? [{ category: "freeCalories" as const, name: meal.freeCalories.description }]
        : []),
    ]);
    const resolved = await this.resolveAndTouch(candidates);

    return {
      version: 2,
      highlights: content.highlights,
      meals: content.meals.map((meal) => ({
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
              throw new Error(`Could not resolve catalog item: ${item.name}`);
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
      })),
    };
  }

  async search(
    category: DietV2CatalogCategory,
    query: string
  ): Promise<IDietV2CatalogItem[]> {
    const normalizedQuery = normalizeDietV2Name(query);

    if (!normalizedQuery) return [];

    return await this.repository.search(category, normalizedQuery, SEARCH_LIMIT);
  }

  async getPopular(limit: number = POPULAR_LIMIT): Promise<DietV2PopularItems> {
    return await this.repository.getPopular(limit);
  }

  async deleteItem(id: string): Promise<IDietV2CatalogItem | null> {
    const deleted = await this.repository.deleteScoped(id);

    this.cache.invalidateAll();

    return deleted;
  }
}
