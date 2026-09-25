import { createSuiteResult } from "../model.mjs";

function errorFromResult(result) {
  if (result?.error) return result.error;
  if (result?.errors?.length) return result.errors.at(-1);
  return undefined;
}

function visitSuite(suite, ancestors, tests) {
  const titles = suite.title ? [...ancestors, suite.title] : ancestors;

  for (const spec of suite.specs ?? []) {
    for (const testCase of spec.tests ?? []) {
      const finalResult = testCase.results?.at(-1);
      const skipped =
        testCase.expectedStatus === "skipped" ||
        testCase.status === "skipped" ||
        !finalResult;
      const status = skipped ? "skipped" : finalResult.status === "passed" ? "passed" : "failed";
      const error = errorFromResult(finalResult);
      const fallbackLocation = spec.file
        ? { file: spec.file, line: spec.line, column: spec.column }
        : undefined;

      tests.push({
        status,
        titlePath: [...titles, spec.title].filter(Boolean),
        durationMs: finalResult?.duration ?? 0,
        failureMessage: error?.message ?? "",
        stack: error?.stack ?? error?.message ?? "",
        location: error?.location ?? fallbackLocation,
      });
    }
  }

  for (const child of suite.suites ?? []) visitSuite(child, titles, tests);
}

export function normalizePlaywrightResult(nativeResult, context) {
  const tests = [];
  for (const suite of nativeResult.suites ?? []) visitSuite(suite, [], tests);

  return createSuiteResult({
    ...context,
    framework: "playwright",
    tests,
    durationMs: tests.reduce((sum, currentTest) => sum + currentTest.durationMs, 0),
  });
}
