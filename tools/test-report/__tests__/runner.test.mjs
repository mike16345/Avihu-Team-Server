import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCli } from "../cli.mjs";
import { runConfiguredSuites } from "../runner.mjs";

const fakeRunnerSource = `
import { writeFile } from "node:fs/promises";

const mode = process.argv[2];
const outputArgument = process.argv.find((argument) => argument.startsWith("--outputFile="));
const outputPath = outputArgument?.slice("--outputFile=".length) ?? process.env.PLAYWRIGHT_JSON_OUTPUT_NAME;
console.log("very noisy console line");

if (mode === "crash") {
  console.error("controlled crash");
  process.exit(2);
}

const failed = mode === "fail";
const suiteLoadFailed = mode === "suite-load-fail";
const nativeResult = {
  startTime: 1000,
  testResults: [{
    name: "/tmp/controlled.test.js",
    endTime: 1010,
    status: suiteLoadFailed ? "failed" : undefined,
    message: suiteLoadFailed ? "controlled suite load failure" : "",
    assertionResults: suiteLoadFailed ? [] : [{
      ancestorTitles: ["controlled suite"],
      title: failed ? "fails" : "passes",
      status: failed ? "failed" : "passed",
      duration: 10,
      failureMessages: failed ? ["controlled failure at /tmp/controlled.test.js:4:2"] : [],
    }],
  }],
};
await writeFile(outputPath, JSON.stringify(nativeResult));
process.exit(failed ? 1 : 0);
`;

async function createFixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "avihu-test-report-"));
  const runnerPath = path.join(directory, "fake-runner.mjs");
  await writeFile(runnerPath, fakeRunnerSource);
  return { directory, runnerPath };
}

function suite(name, runnerPath, mode) {
  return {
    name,
    framework: "jest",
    cwd: ".",
    command: process.execPath,
    args: [runnerPath, mode],
  };
}

test("continues after a failed suite", async () => {
  const { directory, runnerPath } = await createFixture();
  const config = {
    repository: "Controlled",
    outputDir: ".test-report",
    suites: [suite("Fails", runnerPath, "fail"), suite("Passes", runnerPath, "pass")],
  };

  const result = await runConfiguredSuites(config, directory);

  assert.equal(result.suites.length, 2);
  assert.deepEqual(
    result.suites.map((currentSuite) => currentSuite.status),
    ["failed", "passed"]
  );
});

test("missing JSON is an infrastructure failure", async () => {
  const { directory, runnerPath } = await createFixture();
  const config = {
    repository: "Controlled",
    outputDir: ".test-report",
    suites: [suite("Crash", runnerPath, "crash")],
  };

  const result = await runConfiguredSuites(config, directory);

  assert.equal(result.status, "failed");
  assert.match(result.suites[0].infrastructureErrors[0], /exited with code 2/);
  assert.match(result.suites[0].rawLogTail, /controlled crash/);
});

test("preserves suite-load errors produced by an adapter", async () => {
  const { directory, runnerPath } = await createFixture();
  const config = {
    repository: "Controlled",
    outputDir: ".test-report",
    suites: [suite("Load failure", runnerPath, "suite-load-fail")],
  };

  const result = await runConfiguredSuites(config, directory);

  assert.equal(result.status, "failed");
  assert.match(result.suites[0].infrastructureErrors[0], /controlled suite load failure/);
});

test("writes reports while keeping noise in raw.log", async () => {
  const { directory, runnerPath } = await createFixture();
  const config = {
    repository: "Controlled",
    outputDir: ".test-report",
    email: { from: "sender@example.com", to: "recipient@example.com" },
    suites: [suite("Unit", runnerPath, "pass")],
  };

  const run = await runCli(config, directory);

  assert.equal(run.stdout.includes("very noisy console line"), false);
  assert.match(run.stdout, /TESTS PASSED/);
  assert.match(
    await readFile(path.join(directory, ".test-report/suites/unit/raw.log"), "utf8"),
    /very noisy console line/
  );
  for (const artifact of ["result.json", "report.html", "summary.md", "email.eml"]) {
    await readFile(path.join(directory, ".test-report", artifact), "utf8");
  }
});

test("refuses to delete an unsafe output directory", async () => {
  const { directory, runnerPath } = await createFixture();
  const sentinelPath = path.join(directory, "sentinel.txt");
  await writeFile(sentinelPath, "keep me");

  await assert.rejects(
    runConfiguredSuites(
      {
        repository: "Controlled",
        outputDir: ".",
        suites: [suite("Unit", runnerPath, "pass")],
      },
      directory
    ),
    /Unsafe report output directory/
  );
  assert.equal(await readFile(sentinelPath, "utf8"), "keep me");
});
