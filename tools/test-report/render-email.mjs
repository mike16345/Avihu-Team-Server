function safeHeader(value, name) {
  const text = String(value ?? "");
  if (/\r|\n/.test(text)) throw new Error(`${name} header cannot contain a newline`);
  return text;
}

function wrapBase64(value) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "";
}

export function renderEmail({ result, html, from, to }) {
  const repository = safeHeader(result.metadata?.repository, "repository");
  const branch = safeHeader(result.metadata?.branch ?? "local", "branch");
  const sender = safeHeader(from, "from");
  const recipient = safeHeader(to, "to");
  const failedCount = Number(result.counts?.failed ?? 0);
  const subject = `[TESTS FAILED] ${repository} — ${branch} — ${failedCount} failed`;
  const headers = [
    `From: ${sender}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];

  return `${headers.join("\r\n")}\r\n\r\n${wrapBase64(html)}\r\n`;
}
