import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { normalizeResult } from "../adapters/index.mjs";
import { aggregateResults } from "../model.mjs";

const fixturesDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

async function readFixture(framework) {
  return JSON.parse(
    await readFile(path.join(fixturesDirectory, `${framework}-results.json`), "utf8")
  );
}

test("normalizes all runners to identical count semantics", async () => {
  for (const framework of ["jest", "vitest", "playwright"]) {
    const suite = normalizeResult(framework, await readFixture(framework), {
      name: `${framework} suite`,
      rawLogPath: `suites/${framework}/raw.log`,
    });

    assert.deepEqual(suite.counts, { passed: 1, failed: 1, skipped: 1, total: 3 });
    assert.equal(suite.status, "failed");
    assert.equal(suite.tests[1].failureMessage.includes("שגיאת בדיקה"), true);
    assert.equal(suite.tests[1].location.line > 0, true);
  }
});

test("aggregate status fails when any suite fails", () => {
  const passingSuite = {
    name: "passing",
    status: "passed",
    durationMs: 10,
    counts: { passed: 2, failed: 0, skipped: 0, total: 2 },
    tests: [],
  };
  const failingSuite = {
    name: "failing",
    status: "failed",
    durationMs: 20,
    counts: { passed: 0, failed: 1, skipped: 0, total: 1 },
    tests: [],
  };

  const result = aggregateResults({ repository: "Avihu" }, [passingSuite, failingSuite]);

  assert.equal(result.status, "failed");
  assert.deepEqual(result.counts, { passed: 2, failed: 1, skipped: 0, total: 3 });
  assert.equal(result.durationMs, 30);
});

test("Jest suite-load errors remain visible and fail the normalized suite", () => {
  const suite = normalizeResult(
    "jest",
    {
      startTime: 1000,
      numFailedTestSuites: 1,
      numFailedTests: 0,
      testResults: [
        {
          name: "/workspace/tests/load-error.test.ts",
          status: "failed",
          startTime: 1000,
          endTime: 1001,
          assertionResults: [],
          message: "Test suite failed to run: missing required environment variable",
        },
      ],
    },
    { name: "jest suite", rawLogPath: "suites/jest/raw.log" }
  );

  assert.equal(suite.status, "failed");
  assert.deepEqual(suite.counts, { passed: 0, failed: 0, skipped: 0, total: 0 });
  assert.match(suite.infrastructureErrors[0], /load-error\.test\.ts/);
  assert.match(suite.infrastructureErrors[0], /missing required environment variable/);
});
