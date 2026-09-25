import { failedTests, firstLine, formatDuration, testLocation, testTitle } from "./format.mjs";

function conciseInfrastructureLines(error) {
  return String(error)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export function renderTerminal(result) {
  const { counts, metadata } = result;
  const outputDirectory = metadata.outputDir ?? ".test-report";
  const lines = [
    `TESTS ${result.status === "passed" ? "PASSED" : "FAILED"} — ${metadata.repository}`,
    `Passed ${counts.passed} | Failed ${counts.failed} | Skipped ${counts.skipped} | Total ${counts.total} | ${formatDuration(result.durationMs)}`,
  ];

  if (result.status === "failed") {
    lines.push("", "FAILED");
    let failureNumber = 0;
    for (const { test } of failedTests(result)) {
      failureNumber += 1;
      lines.push(`${failureNumber}. ${testTitle(test) || "Unnamed test"}`);
      const location = testLocation(test);
      if (location) lines.push(`   ${location}`);
      const message = firstLine(test.failureMessage || test.stack);
      if (message) lines.push(`   ${message}`);
    }

    for (const suite of result.suites) {
      for (const error of suite.infrastructureErrors ?? []) {
        failureNumber += 1;
        lines.push(`${failureNumber}. ${suite.name} infrastructure failure`);
        for (const detail of conciseInfrastructureLines(error)) lines.push(`   ${detail}`);
      }
    }
  }

  lines.push("", `Report: ${outputDirectory}/report.html`, `Raw logs: ${outputDirectory}/suites/`);
  return `${lines.join("\n")}\n`;
}
