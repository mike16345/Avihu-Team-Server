export type FoodCatalogProvider = "open_food_facts" | "admin" | "future_provider";

export interface FoodCatalogProvenance {
  provider: FoodCatalogProvider;
  license: string | null;
  sourceUrl: string | null;
}

export const buildFoodCatalogProvenance = (
  provider: FoodCatalogProvider,
  providerId: string | null
): FoodCatalogProvenance => {
  if (provider !== "open_food_facts") {
    return { provider, license: null, sourceUrl: null };
  }

  const normalizedProviderId = providerId?.trim() || null;
  return {
    provider,
    license: "ODbL-1.0",
    sourceUrl: normalizedProviderId
      ? `https://world.openfoodfacts.org/product/${encodeURIComponent(normalizedProviderId)}`
      : null,
  };
};
