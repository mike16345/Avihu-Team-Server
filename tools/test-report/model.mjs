export const EMPTY_COUNTS = Object.freeze({ passed: 0, failed: 0, skipped: 0, total: 0 });

export function countTests(tests) {
  return tests.reduce(
    (counts, currentTest) => {
      counts[currentTest.status] += 1;
      counts.total += 1;
      return counts;
    },
    { ...EMPTY_COUNTS }
  );
}

export function createSuiteResult({
  name,
  framework,
  tests,
  durationMs,
  rawLogPath,
  infrastructureErrors = [],
  rawLogTail = "",
}) {
  const counts = countTests(tests);
  const status = counts.failed === 0 && infrastructureErrors.length === 0 ? "passed" : "failed";

  return {
    name,
    framework,
    status,
    durationMs,
    counts,
    tests,
    rawLogPath,
    infrastructureErrors,
    rawLogTail,
  };
}

export function aggregateResults(metadata, suites) {
  const counts = suites.reduce(
    (sum, suite) => ({
      passed: sum.passed + suite.counts.passed,
      failed: sum.failed + suite.counts.failed,
      skipped: sum.skipped + suite.counts.skipped,
      total: sum.total + suite.counts.total,
    }),
    { ...EMPTY_COUNTS }
  );

  return {
    metadata,
    status: suites.every((suite) => suite.status === "passed") ? "passed" : "failed",
    durationMs: suites.reduce((sum, suite) => sum + suite.durationMs, 0),
    counts,
    suites,
  };
}
