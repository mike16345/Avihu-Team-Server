import { spawn, execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { lstat, mkdir, open, readFile, realpath, rm } from "node:fs/promises";
import path from "node:path";

import { normalizeResult } from "./adapters/index.mjs";
import { aggregateResults, createSuiteResult } from "./model.mjs";

const RAW_LOG_TAIL_BYTES = 8_000;

export const FRAMEWORK_ARGUMENTS = {
  jest: (nativeResultPath) => ["--json", `--outputFile=${nativeResultPath}`],
  vitest: (nativeResultPath) => ["--reporter=json", `--outputFile=${nativeResultPath}`],
  playwright: () => ["--reporter=json"],
};

function slugify(value, fallback) {
  const slug = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

async function validateOutputDirectory(configDirectory, configuredPath) {
  if (!configuredPath || path.isAbsolute(configuredPath)) {
    throw new Error(`Unsafe report output directory: ${configuredPath}`);
  }

  const basePath = path.resolve(configDirectory);
  const outputPath = path.resolve(basePath, configuredPath);
  const relativePath = path.relative(basePath, outputPath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe report output directory: ${configuredPath}`);
  }

  try {
    const outputStat = await lstat(outputPath);
    if (outputStat.isSymbolicLink()) {
      throw new Error(`Unsafe report output directory: ${configuredPath} is a symbolic link`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const realBasePath = await realpath(basePath);
  const realParentPath = await realpath(path.dirname(outputPath));
  const realRelativePath = path.relative(realBasePath, realParentPath);
  if (realRelativePath.startsWith("..") || path.isAbsolute(realRelativePath)) {
    throw new Error(`Unsafe report output directory: ${configuredPath}`);
  }

  return outputPath;
}

async function readLogTail(logPath) {
  const handle = await open(logPath, "r");
  try {
    const { size } = await handle.stat();
    const length = Math.min(size, RAW_LOG_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);
    return buffer.toString("utf8");
  } finally {
    await handle.close();
  }
}

function runChild(command, args, options, logPath) {
  return new Promise((resolve) => {
    const log = createWriteStream(logPath, { flags: "w" });
    let spawnError;
    const child = spawn(command, args, { ...options, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => log.write(chunk));
    child.stderr.on("data", (chunk) => log.write(chunk));
    child.on("error", (error) => {
      spawnError = error;
    });
    child.on("close", (exitCode, signal) => {
      log.end(() => resolve({ exitCode, signal, spawnError }));
    });
  });
}

function gitValue(configDirectory, args, fallback) {
  try {
    return execFileSync("git", args, {
      cwd: configDirectory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function buildMetadata(config, configDirectory) {
  const serverUrl = process.env.GITHUB_SERVER_URL;
  const githubRepository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  return {
    repository: config.repository,
    branch:
      process.env.GITHUB_HEAD_REF ||
      process.env.GITHUB_REF_NAME ||
      gitValue(configDirectory, ["branch", "--show-current"], "local"),
    commit: process.env.GITHUB_SHA || gitValue(configDirectory, ["rev-parse", "HEAD"], "unknown"),
    actor: process.env.GITHUB_ACTOR || undefined,
    workflow: process.env.GITHUB_WORKFLOW || undefined,
    runUrl:
      serverUrl && githubRepository && runId
        ? `${serverUrl}/${githubRepository}/actions/runs/${runId}`
        : undefined,
    generatedAt: new Date().toISOString(),
    outputDir: config.outputDir,
  };
}

async function runSuite(suite, index, configDirectory, outputDirectory, usedSlugs) {
  const frameworkArguments = FRAMEWORK_ARGUMENTS[suite.framework];
  if (!frameworkArguments) throw new Error(`Unsupported test framework: ${suite.framework}`);

  const baseSlug = slugify(suite.name, `suite-${index + 1}`);
  let suiteSlug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(suiteSlug)) suiteSlug = `${baseSlug}-${suffix++}`;
  usedSlugs.add(suiteSlug);

  const suiteDirectory = path.join(outputDirectory, "suites", suiteSlug);
  const rawLogPath = path.join(suiteDirectory, "raw.log");
  const nativeResultPath = path.join(suiteDirectory, "runner-results.json");
  const relativeRawLogPath = path.posix.join("suites", suiteSlug, "raw.log");
  await mkdir(suiteDirectory, { recursive: true });

  const environment = { ...process.env };
  if (suite.framework === "playwright") {
    environment.PLAYWRIGHT_JSON_OUTPUT_NAME = nativeResultPath;
  }
  const args = [...(suite.args ?? []), ...frameworkArguments(nativeResultPath)];
  const childResult = await runChild(
    suite.command,
    args,
    { cwd: path.resolve(configDirectory, suite.cwd), env: environment },
    rawLogPath
  );
  const rawLogTail = await readLogTail(rawLogPath);
  const infrastructureErrors = [];

  if (childResult.spawnError) {
    infrastructureErrors.push(`Could not start test runner: ${childResult.spawnError.message}`);
  }

  let nativeResult;
  try {
    nativeResult = JSON.parse(await readFile(nativeResultPath, "utf8"));
  } catch (error) {
    const exitDescription = childResult.signal
      ? `terminated by signal ${childResult.signal}`
      : `exited with code ${childResult.exitCode ?? "unknown"}`;
    infrastructureErrors.push(
      `Test runner ${exitDescription} without readable JSON results: ${error.message}`
    );
  }

  if (!nativeResult) {
    return createSuiteResult({
      name: suite.name,
      framework: suite.framework,
      tests: [],
      durationMs: 0,
      rawLogPath: relativeRawLogPath,
      infrastructureErrors,
      rawLogTail,
    });
  }

  const normalized = normalizeResult(suite.framework, nativeResult, {
    name: suite.name,
    rawLogPath: relativeRawLogPath,
  });
  const allInfrastructureErrors = [
    ...(normalized.infrastructureErrors ?? []),
    ...infrastructureErrors,
  ];
  return {
    ...normalized,
    status: allInfrastructureErrors.length ? "failed" : normalized.status,
    rawLogTail,
    infrastructureErrors: allInfrastructureErrors,
  };
}

export async function runConfiguredSuites(config, configDirectory) {
  const outputDirectory = await validateOutputDirectory(configDirectory, config.outputDir);
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, "suites"), { recursive: true });

  const suites = [];
  const usedSlugs = new Set();
  for (const [index, suite] of config.suites.entries()) {
    suites.push(await runSuite(suite, index, configDirectory, outputDirectory, usedSlugs));
  }

  return aggregateResults(buildMetadata(config, configDirectory), suites);
}
