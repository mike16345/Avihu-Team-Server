import { Types } from "mongoose";
import {
  FoodCatalogAdminOverrides,
  FoodCatalogProviderData,
} from "../../interfaces/IFoodCatalogItem";

const isObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);

const mergeLeaves = (base: any, overlay: any): any => {
  if (!isObject(overlay)) return overlay === undefined || overlay === null ? base : overlay;
  const result = isObject(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(overlay)) {
    if (["updatedAt", "updatedBy", "reason"].includes(key)) continue;
    if (value !== undefined && value !== null) result[key] = mergeLeaves(result[key], value);
  }
  return result;
};

const patchLeaves = (base: any, patch: any): any => {
  const result = isObject(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value === null) delete result[key];
    else if (isObject(value)) {
      const nested = patchLeaves(result[key], value);
      if (Object.keys(nested).length === 0) delete result[key];
      else result[key] = nested;
    } else if (value !== undefined) result[key] = value;
  }
  return result;
};

export const mergeFoodCatalogData = (
  providerData: FoodCatalogProviderData,
  overrides: FoodCatalogAdminOverrides | null
): FoodCatalogProviderData => mergeLeaves(providerData, overrides);

export const applyAdminOverridePatch = (
  current: FoodCatalogAdminOverrides | null,
  patch: Record<string, any>,
  adminId: Types.ObjectId,
  now: Date,
  reason?: string
): FoodCatalogAdminOverrides | null => {
  const values = patchLeaves(current, patch);
  delete values.updatedAt;
  delete values.updatedBy;
  delete values.reason;
  if (Object.keys(values).length === 0) return null;
  return { ...values, updatedAt: now, updatedBy: adminId, ...(reason ? { reason } : {}) };
};
