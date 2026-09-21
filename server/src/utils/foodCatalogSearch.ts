import { FoodCatalogProviderData } from "../interfaces/IFoodCatalogItem";

const MINIMUM_PREFIX_LENGTH = 2;
const MAXIMUM_PREFIX_LENGTH = 40;

export interface FoodCatalogSearchFields {
  normalizedNames: string[];
  normalizedBrand: string | null;
  aliases: string[];
  prefixes: string[];
}

export const normalizeFoodCatalogSearchText = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

export const tokenizeFoodCatalogSearch = (value: string): string[] =>
  normalizeFoodCatalogSearchText(value)
    .split(" ")
    .filter((term) => term.length >= MINIMUM_PREFIX_LENGTH);

const uniqueNormalized = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map(normalizeFoodCatalogSearchText)
        .filter(Boolean)
    )
  );

const buildPrefixes = (values: string[]): string[] => {
  const prefixes = new Set<string>();
  values.forEach((value) => {
    value.split(" ").forEach((word) => {
      const cappedLength = Math.min(word.length, MAXIMUM_PREFIX_LENGTH);
      for (let length = MINIMUM_PREFIX_LENGTH; length <= cappedLength; length += 1) {
        prefixes.add(word.slice(0, length));
      }
    });
  });
  return Array.from(prefixes);
};

export const buildFoodCatalogSearchFields = (
  providerData: FoodCatalogProviderData,
  effectiveData: FoodCatalogProviderData = providerData
): FoodCatalogSearchFields => {
  const normalizedNames = uniqueNormalized([
    providerData.names.he,
    providerData.names.en,
    providerData.names.original,
    effectiveData.names.he,
    effectiveData.names.en,
    effectiveData.names.original,
  ]);
  const normalizedBrands = uniqueNormalized([providerData.brand, effectiveData.brand]);
  const normalizedBrand = effectiveData.brand
    ? normalizeFoodCatalogSearchText(effectiveData.brand)
    : null;
  const aliases = normalizedBrands.filter((brand) => brand !== normalizedBrand);

  return {
    normalizedNames,
    normalizedBrand,
    aliases,
    prefixes: buildPrefixes([...normalizedNames, ...normalizedBrands]),
  };
};
