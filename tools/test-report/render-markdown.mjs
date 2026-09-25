import { failedTests, firstLine, formatDuration, testLocation, testTitle } from "./format.mjs";

function escapeMarkdownCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

export function renderMarkdown(result) {
  const { counts, metadata } = result;
  const icon = result.status === "passed" ? "✅" : "❌";
  const lines = [
    `# ${icon} Tests ${result.status === "passed" ? "passed" : "failed"} — ${metadata.repository}`,
    "",
    `**Passed ${counts.passed} · Failed ${counts.failed} · Skipped ${counts.skipped} · Total ${counts.total} · ${formatDuration(result.durationMs)}**`,
    "",
    "| Suite | Status | Passed | Failed | Skipped | Total |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
  ];

  for (const suite of result.suites) {
    lines.push(
      `| ${escapeMarkdownCell(suite.name)} | ${suite.status === "passed" ? "Passed" : "Failed"} | ${suite.counts.passed} | ${suite.counts.failed} | ${suite.counts.skipped} | ${suite.counts.total} |`
    );
  }

  if (result.status === "failed") {
    lines.push("", "## Failures", "");
    for (const { test } of failedTests(result)) {
      lines.push(`- **${testTitle(test) || "Unnamed test"}**`);
      const location = testLocation(test);
      if (location) lines.push(`  - Location: \`${location}\``);
      const message = firstLine(test.failureMessage || test.stack);
      if (message) lines.push(`  - ${message}`);
    }
    for (const suite of result.suites) {
      for (const error of suite.infrastructureErrors ?? []) {
        lines.push(`- **${suite.name} infrastructure failure**`, `  - ${firstLine(error)}`);
      }
    }
  }

  if (metadata.runUrl) lines.push("", `[Open GitHub Actions run](${metadata.runUrl})`);
  lines.push("", `Full HTML report: \`${metadata.outputDir ?? ".test-report"}/report.html\``);
  return `${lines.join("\n")}\n`;
}
