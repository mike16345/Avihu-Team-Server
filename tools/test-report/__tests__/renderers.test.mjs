import assert from "node:assert/strict";
import test from "node:test";

import { escapeHtml, renderHtml, truncateText } from "../render-html.mjs";
import { renderMarkdown } from "../render-markdown.mjs";
import { renderTerminal } from "../render-terminal.mjs";

const failedRun = {
  metadata: {
    repository: "Avihu <script>alert(1)</script>",
    branch: "devel",
    commit: "abcdef123456",
    runUrl: "https://github.com/avihu/actions/runs/123",
    generatedAt: "2026-09-25T12:00:00.000Z",
    outputDir: ".test-report",
  },
  status: "failed",
  durationMs: 10600,
  counts: { passed: 1, failed: 1, skipped: 1, total: 3 },
  suites: [
    {
      name: "Unit tests",
      framework: "jest",
      status: "failed",
      durationMs: 10600,
      counts: { passed: 1, failed: 1, skipped: 1, total: 3 },
      rawLogPath: "suites/unit/raw.log",
      rawLogTail: "raw noisy console line",
      infrastructureErrors: [],
      tests: [
        {
          status: "passed",
          titlePath: ["suite", "passed test"],
          durationMs: 4,
          failureMessage: "",
          stack: "",
        },
        {
          status: "failed",
          titlePath: ["suite", "failed test"],
          durationMs: 6,
          failureMessage: 'Expected <strong>safe</strong> & "quoted" — שגיאת בדיקה',
          stack:
            'Error: Expected <strong>safe</strong> & "quoted" — שגיאת בדיקה\n    at /workspace/tests/sample.test.ts:12:7',
          location: { file: "tests/sample.test.ts", line: 12, column: 7 },
        },
        {
          status: "skipped",
          titlePath: ["suite", "skipped test"],
          durationMs: 0,
          failureMessage: "",
          stack: "",
        },
      ],
    },
  ],
};

test("HTML escapes untrusted content and puts failures first", () => {
  const html = renderHtml(failedRun);

  assert.match(html, /Expected &lt;strong&gt;safe&lt;\/strong&gt; &amp; &quot;quoted&quot;/);
  assert.equal(html.includes("<script>"), false);
  assert.ok(html.indexOf("failed test") < html.indexOf("passed test"));
});

test("HTML keeps failure details and captured logs collapsed", () => {
  const html = renderHtml(failedRun);

  assert.match(html, /<details[^>]*data-testid="failure-details"/);
  assert.match(html, /<summary[^>]*>[^<]*suite › failed test/);
  assert.match(html, /Expected &lt;strong&gt;safe&lt;\/strong&gt; &amp; &quot;quoted&quot;/);
  assert.match(html, /<details[^>]*data-testid="captured-output"/);
  assert.equal(
    /<details[^>]*data-testid="(?:failure-details|captured-output)"[^>]*\sopen(?:\s|>)/.test(html),
    false
  );
});

test("HTML shows a concise failure reason before the expandable diagnostic", () => {
  const html = renderHtml(failedRun);
  const summaryEnd = html.indexOf("</summary>");
  const stackFrame = html.indexOf("at /workspace/tests/sample.test.ts:12:7");

  assert.ok(summaryEnd > 0);
  assert.ok(stackFrame > summaryEnd);
});

test("HTML shows duration on every test row", () => {
  const html = renderHtml(failedRun);

  assert.match(
    html,
    /data-testid="failed-test-row"[\s\S]*?suite › failed test[\s\S]*?data-testid="test-duration"[^>]*>6ms</
  );
  assert.match(
    html,
    /data-testid="passed-test-row"[\s\S]*?suite › passed test[\s\S]*?data-testid="test-duration"[^>]*>4ms</
  );
  assert.match(
    html,
    /data-testid="skipped-test-row"[\s\S]*?suite › skipped test[\s\S]*?data-testid="test-duration"[^>]*>0ms</
  );
});

test("terminal output excludes captured console noise", () => {
  const output = renderTerminal(failedRun);

  assert.match(output, /Failed 1/);
  assert.match(output, /suite › failed test/);
  assert.equal(output.includes("raw noisy console line"), false);
});

test("terminal output includes the reason for a suite-load failure", () => {
  const infrastructureRun = structuredClone(failedRun);
  infrastructureRun.suites[0].infrastructureErrors = [
    "tests/load-error.test.ts: Test suite failed to run\n\nMissing required AVIHU_TRAINER_ID environment variable.",
  ];

  const output = renderTerminal(infrastructureRun);

  assert.match(output, /Test suite failed to run/);
  assert.match(output, /Missing required AVIHU_TRAINER_ID environment variable/);
});

test("raw excerpts are bounded and retain the artifact path", () => {
  const longLogRun = structuredClone(failedRun);
  longLogRun.suites[0].rawLogTail = "very noisy console line\n".repeat(2000);

  const html = renderHtml(longLogRun, { maxRawLogCharacters: 8000 });

  assert.equal(html.length < 20000, true);
  assert.match(html, /suites\/unit\/raw\.log/);
  assert.match(html, /truncated/);
});

test("Markdown includes suite counts and the GitHub run link", () => {
  const markdown = renderMarkdown(failedRun);

  assert.match(markdown, /\| Unit tests \| Failed \| 1 \| 1 \| 1 \| 3 \|/);
  assert.match(
    markdown,
    /\[Open GitHub Actions run\]\(https:\/\/github\.com\/avihu\/actions\/runs\/123\)/
  );
});

test("escaping and truncation protect report boundaries", () => {
  assert.equal(escapeHtml("<&>\"'"), "&lt;&amp;&gt;&quot;&#39;");
  assert.equal(truncateText("123456", 5), "1234… [truncated]");
});
