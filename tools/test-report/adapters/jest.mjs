import { createSuiteResult } from "../model.mjs";

const SKIPPED_STATUSES = new Set(["pending", "skipped", "todo", "disabled"]);

function normalizeStatus(status) {
  if (status === "passed") return "passed";
  if (SKIPPED_STATUSES.has(status)) return "skipped";
  return "failed";
}

function parseLocation(message, fallbackFile, explicitLocation) {
  if (explicitLocation?.line) {
    return {
      file: fallbackFile,
      line: explicitLocation.line,
      column: explicitLocation.column ?? 1,
    };
  }

  const match = String(message ?? "").match(/((?:[A-Za-z]:)?[^\s()]+):(\d+):(\d+)/);
  if (!match) return fallbackFile ? { file: fallbackFile } : undefined;
  return { file: match[1], line: Number(match[2]), column: Number(match[3]) };
}

export function normalizeJestResult(nativeResult, context, framework = "jest") {
  const tests = [];
  const infrastructureErrors = [];

  for (const fileResult of nativeResult.testResults ?? []) {
    const assertions = fileResult.assertionResults ?? [];
    if (fileResult.status === "failed" && assertions.length === 0) {
      infrastructureErrors.push(
        `${fileResult.name ?? "Unknown test suite"}: ${fileResult.message || "Test suite failed before running assertions."}`
      );
    }

    for (const assertion of assertions) {
      const failureMessage = assertion.failureMessages?.[0] ?? "";
      tests.push({
        status: normalizeStatus(assertion.status),
        titlePath: [...(assertion.ancestorTitles ?? []), assertion.title].filter(Boolean),
        durationMs: assertion.duration ?? 0,
        failureMessage,
        stack: failureMessage,
        location: parseLocation(failureMessage, fileResult.name, assertion.location),
      });
    }
  }

  const startedAt = nativeResult.startTime ?? 0;
  const endedAt = Math.max(
    startedAt,
    ...(nativeResult.testResults ?? []).map((result) => result.endTime ?? startedAt)
  );

  return createSuiteResult({
    ...context,
    framework,
    tests,
    durationMs: Math.max(0, endedAt - startedAt),
    infrastructureErrors,
  });
}
