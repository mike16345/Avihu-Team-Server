import { failedTests, formatDuration, testLocation, testTitle } from "./format.mjs";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function truncateText(value, maxCharacters) {
  const text = String(value ?? "");
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, Math.max(0, maxCharacters - 1))}… [truncated]`;
}

function countCard(label, value, color) {
  return `<td style="padding:4px;width:25%"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;box-sizing:border-box;padding:12px 6px;text-align:center;width:100%"><div style="color:${color};font-size:clamp(18px,5vw,28px);font-weight:800;line-height:1">${value}</div><div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:.04em;margin-top:8px;overflow-wrap:anywhere;text-transform:uppercase">${label}</div></div></td>`;
}

function failureCard(test, index) {
  const location = testLocation(test);
  return `<div style="background:#fff;border:1px solid #fecaca;border-left:5px solid #dc2626;border-radius:12px;margin:0 0 14px;padding:18px">
    <div style="color:#991b1b;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Failure ${index}</div>
    <div style="color:#111827;font-size:16px;font-weight:750;margin-top:6px">${escapeHtml(testTitle(test) || "Unnamed test")}</div>
    ${location ? `<div style="color:#6b7280;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;margin-top:6px;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(location)}</div>` : ""}
    <pre style="background:#111827;border-radius:9px;box-sizing:border-box;color:#f9fafb;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.55;margin:14px 0 0;max-width:100%;overflow-wrap:anywhere;padding:14px;white-space:pre-wrap;word-break:break-word">${escapeHtml(test.stack || test.failureMessage || "No failure message was provided.")}</pre>
  </div>`;
}

function infrastructureCard(suite, error) {
  return `<div style="background:#fff7ed;border:1px solid #fed7aa;border-left:5px solid #ea580c;border-radius:12px;margin:0 0 14px;min-width:0;padding:18px"><div style="color:#9a3412;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Infrastructure failure</div><div style="color:#111827;font-size:16px;font-weight:750;margin-top:6px">${escapeHtml(suite.name)}</div><pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;max-width:100%;overflow-wrap:anywhere;white-space:pre-wrap;word-break:break-word">${escapeHtml(error)}</pre></div>`;
}

export function renderHtml(result, options = {}) {
  const maxRawLogCharacters = options.maxRawLogCharacters ?? 8000;
  const failed = result.status === "failed";
  const accent = failed ? "#dc2626" : "#16a34a";
  const paleAccent = failed ? "#fef2f2" : "#f0fdf4";
  const failures = failedTests(result);
  const failureCards = failures.map(({ test }, index) => failureCard(test, index + 1)).join("");
  const infrastructureCards = result.suites
    .flatMap((suite) =>
      (suite.infrastructureErrors ?? []).map((error) => infrastructureCard(suite, error))
    )
    .join("");
  const suiteRows = result.suites
    .map(
      (suite) => `<tr>
        <td style="border-bottom:1px solid #e5e7eb;padding:12px 10px;font-weight:700">${escapeHtml(suite.name)}</td>
        <td style="border-bottom:1px solid #e5e7eb;padding:12px 10px;color:${suite.status === "passed" ? "#15803d" : "#b91c1c"};font-weight:800">${suite.status === "passed" ? "Passed" : "Failed"}</td>
        <td style="border-bottom:1px solid #e5e7eb;padding:12px 10px;text-align:right">${suite.counts.passed}</td>
        <td style="border-bottom:1px solid #e5e7eb;padding:12px 10px;text-align:right">${suite.counts.failed}</td>
        <td style="border-bottom:1px solid #e5e7eb;padding:12px 10px;text-align:right">${suite.counts.skipped}</td>
        <td style="border-bottom:1px solid #e5e7eb;padding:12px 10px;text-align:right">${formatDuration(suite.durationMs)}</td>
      </tr>`
    )
    .join("");
  const passedAndSkipped = result.suites
    .flatMap((suite) => suite.tests)
    .filter((currentTest) => currentTest.status !== "failed")
    .sort((left, right) => left.status.localeCompare(right.status))
    .map(
      (currentTest) => `<li style="border-bottom:1px solid #f3f4f6;padding:8px 0"><span style="color:${currentTest.status === "passed" ? "#15803d" : "#a16207"};font-weight:800">${currentTest.status === "passed" ? "PASS" : "SKIP"}</span> <span style="color:#374151">${escapeHtml(testTitle(currentTest))}</span></li>`
    )
    .join("");
  const rawLogs = result.suites
    .map((suite) => {
      const excerpt = truncateText(suite.rawLogTail ?? "", maxRawLogCharacters);
      const wasTruncated = String(suite.rawLogTail ?? "").length > maxRawLogCharacters;
      return `<div style="margin-top:14px"><div style="font-weight:750">${escapeHtml(suite.name)}</div><div style="color:#6b7280;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;margin-top:4px">Artifact: ${escapeHtml(suite.rawLogPath)}</div>${excerpt ? `<pre style="background:#111827;border-radius:9px;color:#d1d5db;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;max-height:360px;overflow:auto;padding:14px;white-space:pre-wrap">${escapeHtml(excerpt)}${wasTruncated ? "" : ""}</pre>` : '<div style="color:#6b7280;font-size:13px;margin-top:6px">No console output captured.</div>'}</div>`;
    })
    .join("");
  const metadata = result.metadata;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${failed ? "Failed" : "Passed"} tests — ${escapeHtml(metadata.repository)}</title></head>
<body style="background:#f3f4f6;color:#111827;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:24px">
  <main style="margin:0 auto;max-width:920px">
    <section style="background:${paleAccent};border:1px solid ${accent};border-radius:18px;padding:24px">
      <div style="color:${accent};font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase">${failed ? "Action required" : "All clear"}</div>
      <h1 style="font-size:28px;line-height:1.2;margin:8px 0 4px">Tests ${failed ? "failed" : "passed"}</h1>
      <div style="color:#4b5563">${escapeHtml(metadata.repository)} · ${escapeHtml(metadata.branch ?? "local")} · ${escapeHtml(String(metadata.commit ?? "").slice(0, 12))}</div>
    </section>
    <table role="presentation" style="border-collapse:collapse;margin:16px 0;table-layout:fixed;width:100%"><tr>${countCard("Passed", result.counts.passed, "#15803d")}${countCard("Failed", result.counts.failed, "#b91c1c")}${countCard("Skipped", result.counts.skipped, "#a16207")}${countCard("Duration", formatDuration(result.durationMs), "#1d4ed8")}</tr></table>
    ${failed ? `<section style="margin-top:26px"><h2 style="font-size:20px;margin:0 0 14px">Failures first</h2>${failureCards}${infrastructureCards}</section>` : ""}
    <section style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;margin-top:24px;overflow:auto;padding:18px"><h2 style="font-size:20px;margin:0 0 10px">Suites</h2><table style="border-collapse:collapse;min-width:620px;width:100%"><thead><tr style="color:#6b7280;font-size:11px;letter-spacing:.06em;text-transform:uppercase"><th style="padding:10px;text-align:left">Suite</th><th style="padding:10px;text-align:left">Status</th><th style="padding:10px;text-align:right">Passed</th><th style="padding:10px;text-align:right">Failed</th><th style="padding:10px;text-align:right">Skipped</th><th style="padding:10px;text-align:right">Duration</th></tr></thead><tbody>${suiteRows}</tbody></table></section>
    <section style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;margin-top:24px;padding:18px"><h2 style="font-size:20px;margin:0">Passed and skipped</h2><ul style="list-style:none;margin:10px 0 0;padding:0">${passedAndSkipped || '<li style="color:#6b7280">No passed or skipped tests.</li>'}</ul></section>
    <section style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;margin-top:24px;padding:18px"><h2 style="font-size:20px;margin:0">Captured console output</h2><p style="color:#6b7280;font-size:13px">The report shows bounded excerpts. Download the artifact paths below for complete logs.</p>${rawLogs}</section>
    <footer style="color:#6b7280;font-size:12px;line-height:1.7;padding:22px 4px">Generated ${escapeHtml(metadata.generatedAt ?? "")}<br>${metadata.runUrl ? `<a href="${escapeHtml(metadata.runUrl)}" style="color:#2563eb">Open GitHub Actions run</a>` : "Local test run"}</footer>
  </main>
</body></html>`;
}
