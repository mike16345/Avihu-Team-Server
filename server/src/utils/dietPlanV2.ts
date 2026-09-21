import {
  DietV2Category,
  DietV2MealCategory,
  DietV2MealMacros,
  DietV2PlanItem,
} from "../interfaces/IDietPlanV2";

export const normalizeDietV2Name = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/** Keeps older V2 records readable without mutating or migrating their stored shape. */
export const normalizeDietV2Response = <T extends Record<string, any>>(plan: T): T => {
  if (plan.version !== 2) return plan;

  return {
    ...plan,
    highlights: Array.isArray(plan.highlights)
      ? plan.highlights
          .map((highlight: unknown) => `<p>${escapeHtml(String(highlight))}</p>`)
          .join("")
      : plan.highlights,
    meals: Array.isArray(plan.meals)
      ? plan.meals.map((meal: Record<string, any>) => {
          const legacyDescription = meal.freeCalories?.description?.trim();
          const freeCalories =
            meal.freeCalories && !Array.isArray(meal.freeCalories.items)
              ? legacyDescription
                ? {
                    calories: meal.freeCalories.calories,
                    items: [{ name: legacyDescription }],
                  }
                : undefined
              : meal.freeCalories;

          const { freeCalories: _legacyFreeCalories, ...rest } = meal;
          return freeCalories ? { ...rest, freeCalories } : rest;
        })
      : plan.meals,
  };
};

const MACRO_FIELDS = ["calories", "protein", "carbs", "fat"] as const;
export const DIET_V2_CATEGORY_MACRO_FIELDS: Record<
  DietV2MealCategory,
  readonly (keyof DietV2MealMacros)[]
> = {
  protein: ["calories", "protein"],
  carbs: ["calories", "carbs"],
  fat: ["calories", "fat"],
  vegetables: ["calories", "carbs"],
};

export const deriveDietV2MealMacros = (categories: DietV2Category[]): DietV2MealMacros =>
  categories.reduce<DietV2MealMacros>(
    (total, category) => {
      if (category.items.length === 0 || !category.macros) return total;

      for (const field of MACRO_FIELDS) total[field] += category.macros[field] ?? 0;
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
      for (const field of DIET_V2_CATEGORY_MACRO_FIELDS[category.category]) {
        const value = category.macros?.[field];

        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          throw new Error(`missing or invalid ${field} macros in ${category.category}`);
        }
      }
    }
    validateDietV2PlanItems(category.items, category.category);
  }
};
