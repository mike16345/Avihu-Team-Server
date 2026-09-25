import assert from "node:assert/strict";
import test from "node:test";

import { renderEmail } from "../render-email.mjs";

const failedRun = {
  metadata: { repository: "Avihu Team Server", branch: "devel" },
  status: "failed",
  counts: { passed: 228, failed: 11, skipped: 0, total: 239 },
};

test("builds a UTF-8 HTML failure email", () => {
  const html = "<html><body>שגיאה</body></html>";
  const email = renderEmail({
    result: failedRun,
    html,
    from: "Avihu CI <michaelgani815@gmail.com>",
    to: "michaelgani815@gmail.com",
  });

  assert.match(email, /^From: Avihu CI <michaelgani815@gmail\.com>\r\n/);
  assert.match(email, /Content-Type: text\/html; charset=UTF-8\r\n/);
  assert.match(email, /Content-Transfer-Encoding: base64\r\n/);
  assert.match(email, /11 failed/);
  assert.equal(email.includes("APP_PASSWORD"), false);
  assert.equal(email.replaceAll("\r\n", "").includes("\n"), false);

  const encodedBody = email.split("\r\n\r\n", 2)[1].replaceAll("\r\n", "");
  assert.equal(Buffer.from(encodedBody, "base64").toString("utf8"), html);
});

test("rejects newline injection in every generated header input", () => {
  for (const mutation of [
    { from: "sender@example.com\r\nBcc: victim@example.com" },
    { to: "recipient@example.com\nBcc: victim@example.com" },
    { repository: "Avihu\r\nBcc: victim@example.com" },
    { branch: "devel\nBcc: victim@example.com" },
  ]) {
    const result = {
      ...failedRun,
      metadata: { ...failedRun.metadata, repository: mutation.repository, branch: mutation.branch },
    };
    assert.throws(
      () =>
        renderEmail({
          result,
          html: "<html></html>",
          from: mutation.from ?? "sender@example.com",
          to: mutation.to ?? "recipient@example.com",
        }),
      /newline/
    );
  }
});

test("labels an unsent passing-run email artifact as passed", () => {
  const email = renderEmail({
    result: {
      ...failedRun,
      status: "passed",
      counts: { passed: 239, failed: 0, skipped: 0, total: 239 },
    },
    html: "<html><body>passed</body></html>",
    from: "sender@example.com",
    to: "recipient@example.com",
  });

  assert.match(email, /Subject: \[TESTS PASSED\] Avihu Team Server — devel/);
  assert.doesNotMatch(email, /TESTS FAILED/);
});
