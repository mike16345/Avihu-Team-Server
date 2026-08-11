import { DietV2Category } from "../interfaces/IDietPlanV2";

export const normalizeDietV2Name = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export const validateDietV2Categories = (categories: DietV2Category[]): void => {
  const categoryNames = new Set<string>();

  for (const category of categories) {
    if (categoryNames.has(category.category)) {
      throw new Error(`duplicate category: ${category.category}`);
    }

    categoryNames.add(category.category);
    const itemNames = new Set<string>();

    for (const item of category.items) {
      const normalizedName = normalizeDietV2Name(item.name);

      if (itemNames.has(normalizedName)) {
        throw new Error(`duplicate item name in ${category.category}`);
      }

      itemNames.add(normalizedName);
    }
  }
};
