export function formatDuration(durationMs = 0) {
  return durationMs < 1000 ? `${Math.round(durationMs)}ms` : `${(durationMs / 1000).toFixed(1)}s`;
}

export function testTitle(test) {
  return (test.titlePath ?? []).join(" › ");
}

export function testLocation(test) {
  if (!test.location?.file) return "";
  const line = test.location.line ? `:${test.location.line}` : "";
  const column = test.location.column ? `:${test.location.column}` : "";
  return `${test.location.file}${line}${column}`;
}

export function firstLine(value = "") {
  return String(value).split(/\r?\n/, 1)[0];
}

export function failedTests(result) {
  return result.suites.flatMap((suite) =>
    suite.tests.filter((currentTest) => currentTest.status === "failed").map((currentTest) => ({
      suite,
      test: currentTest,
    }))
  );
}
