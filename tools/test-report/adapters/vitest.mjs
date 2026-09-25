import { normalizeJestResult } from "./jest.mjs";

export function normalizeVitestResult(nativeResult, context) {
  return normalizeJestResult(nativeResult, context, "vitest");
}
