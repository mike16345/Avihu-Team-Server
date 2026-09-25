import { normalizeJestResult } from "./jest.mjs";
import { normalizePlaywrightResult } from "./playwright.mjs";
import { normalizeVitestResult } from "./vitest.mjs";

const ADAPTERS = {
  jest: normalizeJestResult,
  vitest: normalizeVitestResult,
  playwright: normalizePlaywrightResult,
};

export function normalizeResult(framework, nativeResult, context) {
  const adapter = ADAPTERS[framework];
  if (!adapter) throw new Error(`Unsupported test framework: ${framework}`);
  return adapter(nativeResult, context);
}
