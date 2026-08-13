import { DietV2Category, DietV2MealMacros, DietV2PlanItem } from "../interfaces/IDietPlanV2";

export const normalizeDietV2Name = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const MACRO_FIELDS = ["calories", "protein", "carbs", "fat"] as const;

export const deriveDietV2MealMacros = (categories: DietV2Category[]): DietV2MealMacros =>
  categories.reduce<DietV2MealMacros>(
    (total, category) => {
      if (category.items.length === 0 || !category.macros) return total;

      for (const field of MACRO_FIELDS) total[field] += category.macros[field];
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

export const validateDietV2PlanItems = (items: DietV2PlanItem[], label: string): void => {
  const itemNames = new Set<string>();

  for (const item of items) {
    const normalizedName = normalizeDietV2Name(item.name);

    if (itemNames.has(normalizedName)) {
      throw new Error(`duplicate item name in ${label}`);
    }

    itemNames.add(normalizedName);
  }
};

export const validateDietV2Categories = (categories: DietV2Category[]): void => {
  const categoryNames = new Set<string>();

  for (const category of categories) {
    if (categoryNames.has(category.category)) {
      throw new Error(`duplicate category: ${category.category}`);
    }

    categoryNames.add(category.category);

    if (category.items.length > 0) {
      for (const field of MACRO_FIELDS) {
        const value = category.macros?.[field];

        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          throw new Error(`missing or invalid ${field} macros in ${category.category}`);
        }
      }
    }
    validateDietV2PlanItems(category.items, category.category);
  }
};
