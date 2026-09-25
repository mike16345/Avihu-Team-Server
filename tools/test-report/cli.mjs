#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { renderEmail } from "./render-email.mjs";
import { renderHtml } from "./render-html.mjs";
import { renderMarkdown } from "./render-markdown.mjs";
import { renderTerminal } from "./render-terminal.mjs";
import { runConfiguredSuites } from "./runner.mjs";

function parseArguments(args) {
  const options = { suiteNames: [] };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--config") options.configPath = args[++index];
    else if (argument === "--suite") options.suiteNames.push(args[++index]);
    else if (argument === "--verbose") options.verbose = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.configPath) throw new Error("Missing required --config <path>");
  return options;
}

function selectSuites(config, suiteNames) {
  if (!suiteNames?.length) return config;
  const selected = config.suites.filter((suite) => suiteNames.includes(suite.name));
  const missing = suiteNames.filter((name) => !selected.some((suite) => suite.name === name));
  if (missing.length) throw new Error(`Unknown suite: ${missing.join(", ")}`);
  return { ...config, suites: selected };
}

export async function runCli(config, configDirectory, options = {}) {
  const selectedConfig = selectSuites(config, options.suiteNames);
  const result = await runConfiguredSuites(selectedConfig, configDirectory);
  const outputDirectory = path.resolve(configDirectory, selectedConfig.outputDir);
  await mkdir(outputDirectory, { recursive: true });

  const html = renderHtml(result);
  const markdown = renderMarkdown(result);
  const email = renderEmail({
    result,
    html,
    from: selectedConfig.email.from,
    to: selectedConfig.email.to,
  });
  await Promise.all([
    writeFile(path.join(outputDirectory, "result.json"), `${JSON.stringify(result, null, 2)}\n`),
    writeFile(path.join(outputDirectory, "report.html"), html),
    writeFile(path.join(outputDirectory, "summary.md"), markdown),
    writeFile(path.join(outputDirectory, "email.eml"), email),
  ]);

  let stdout = renderTerminal(result);
  if (options.verbose) {
    for (const suite of result.suites) {
      stdout += `\n--- ${suite.name} captured output ---\n${suite.rawLogTail || "(empty)"}\n`;
    }
  }
  return { result, stdout };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const configPath = path.resolve(process.cwd(), options.configPath);
  const { default: config } = await import(pathToFileURL(configPath));
  const run = await runCli(config, path.dirname(configPath), options);
  process.stdout.write(run.stdout);
  process.exitCode = run.result.status === "passed" ? 0 : 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`Test report failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
