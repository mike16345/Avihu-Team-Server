import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const { default: config } = await import(
  pathToFileURL(path.join(repoRoot, "test-report.config.mjs"))
);
const workflowPath = path.resolve(repoRoot, config.workflowPath);

test("workflow publishes every report and emails only failures", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /id: test_report/);
  assert.match(workflow, /continue-on-error: true/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /steps\.test_report\.outcome == 'failure'/);
  assert.match(workflow, /smtps:\/\/smtp\.gmail\.com:465/);
  assert.match(workflow, /secrets\.TEST_REPORT_SMTP_USER/);
  assert.match(workflow, /secrets\.TEST_REPORT_SMTP_APP_PASSWORD/);
  assert.match(workflow, /Failure email skipped because SMTP secrets are unavailable/);
  assert.match(workflow, /exit 1/);
  assert.doesNotMatch(workflow, /echo.*TEST_REPORT_SMTP_APP_PASSWORD/);
});
