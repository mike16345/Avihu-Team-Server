const { execFileSync } = require("child_process");
const dotenv = require("dotenv");
const fs = require("fs");
const inquirer = require("inquirer");
const os = require("os");
const path = require("path");

const { lambdaConfig } = require("../config/lambdaConfig");
const { setupAliases } = require("./setupAliases");

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const PROJECT_ROOT = path.resolve(__dirname, "..");
const LAMBDA_FOLDER = path.join(PROJECT_ROOT, "src", "functions");
const RUNTIME = "nodejs22.x";
const HANDLER = "index.handler";
const ARCHIVE_NAME = "archive.zip";
const FUNCTION_NAME_PATTERN = /^[A-Za-z0-9-_]{1,64}$/;

function getLambdaHandlers(folder = LAMBDA_FOLDER) {
  if (!fs.existsSync(folder)) return [];

  return fs
    .readdirSync(folder, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) return getLambdaHandlers(fullPath);
      if (entry.isFile() && (entry.name === "index.ts" || entry.name === "index.js")) {
        return [fullPath];
      }
      return [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function validateFunctionName(value) {
  const functionName = typeof value === "string" ? value.trim() : "";
  if (!FUNCTION_NAME_PATTERN.test(functionName)) {
    throw new Error(
      "Lambda function name must be 1-64 characters using letters, numbers, hyphens, or underscores."
    );
  }
  return functionName;
}

async function resolveFunctionName(argument, prompt = inquirer.default.prompt) {
  if (argument) return validateFunctionName(argument);

  const answer = await prompt([
    {
      type: "input",
      name: "functionName",
      message: "Enter the new Lambda function name:",
      validate: (value) => {
        try {
          validateFunctionName(value);
          return true;
        } catch (error) {
          return error.message;
        }
      },
    },
  ]);

  return validateFunctionName(answer.functionName);
}

async function selectLambdaHandler(
  handlers,
  root = LAMBDA_FOLDER,
  prompt = inquirer.default.prompt
) {
  if (handlers.length === 0) throw new Error("No Lambda handlers were found in src/functions.");

  const choices = handlers.map((handlerPath) => path.relative(root, handlerPath));
  const { selectedHandler } = await prompt([
    {
      type: "list",
      name: "selectedHandler",
      message: "Select the Lambda handler to bundle:",
      choices,
      pageSize: 20,
    },
  ]);
  const selectedIndex = choices.indexOf(selectedHandler);
  if (selectedIndex === -1) throw new Error("The selected Lambda handler is invalid.");
  return handlers[selectedIndex];
}

function defaultLambdaBuildBinary() {
  const executable = process.platform === "win32" ? "lambda-build.cmd" : "lambda-build";
  return path.join(PROJECT_ROOT, "node_modules", ".bin", executable);
}

async function createLambda(options, dependencies = {}) {
  const functionName = validateFunctionName(options.functionName);
  const handlerPath = path.resolve(options.handlerPath);
  if (!fs.existsSync(handlerPath)) {
    throw new Error(`Lambda handler was not found: ${handlerPath}`);
  }

  const run = dependencies.execFileSync ?? execFileSync;
  const aliasSetup = dependencies.setupAliases ?? setupAliases;
  const createTemporaryDirectory =
    dependencies.createTemporaryDirectory ??
    (() => fs.mkdtempSync(path.join(os.tmpdir(), "avihu-lambda-")));
  const lambdaBuildBinary = dependencies.lambdaBuildBinary ?? defaultLambdaBuildBinary();
  const roleArn =
    dependencies.roleArn ??
    (process.env.AWS_ACCOUNT_ID
      ? `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/BasicLambdaRole`
      : null);
  const region = dependencies.region ?? process.env.AMAZON_REGION;
  const timeout = dependencies.timeout ?? lambdaConfig.timeout;

  if (!roleArn) throw new Error("Missing required AWS_ACCOUNT_ID environment variable.");
  if (!region) throw new Error("Missing required AMAZON_REGION environment variable.");

  let temporaryDirectory;
  let operationError;

  try {
    temporaryDirectory = createTemporaryDirectory();
    const archivePath = path.join(temporaryDirectory, ARCHIVE_NAME);

    console.log(`Bundling ${path.relative(PROJECT_ROOT, handlerPath)}...`);
    run(lambdaBuildBinary, ["archive", "-e", handlerPath], {
      cwd: temporaryDirectory,
      stdio: "inherit",
    });

    if (!fs.existsSync(archivePath)) {
      throw new Error("lambda-build did not create the expected archive.zip file.");
    }

    console.log(`Creating Lambda function "${functionName}" in region ${region}...`);
    run(
      "aws",
      [
        "lambda",
        "create-function",
        "--function-name",
        functionName,
        "--runtime",
        RUNTIME,
        "--role",
        roleArn,
        "--handler",
        HANDLER,
        "--zip-file",
        `fileb://${archivePath}`,
        "--timeout",
        String(timeout),
        "--region",
        region,
      ],
      { stdio: "inherit" }
    );

    try {
      await Promise.resolve(aliasSetup(functionName));
    } catch (error) {
      throw new Error(`Lambda was created, but alias setup failed: ${error.message}`);
    }
    console.log(`✅ Lambda function "${functionName}" created successfully.`);
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    if (temporaryDirectory) {
      try {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
      } catch (cleanupError) {
        if (!operationError) throw cleanupError;
        console.error("Failed to clean temporary Lambda archive:", cleanupError.message);
      }
    }
  }
}

async function promptAndCreateLambda() {
  const functionName = await resolveFunctionName(process.argv[2]);
  const handlers = getLambdaHandlers();
  const handlerPath = await selectLambdaHandler(handlers);
  await createLambda({ functionName, handlerPath });
}

if (require.main === module) {
  promptAndCreateLambda().catch((error) => {
    console.error(`❌ Failed to create Lambda function: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  createLambda,
  getLambdaHandlers,
  promptAndCreateLambda,
  resolveFunctionName,
  selectLambdaHandler,
  validateFunctionName,
};
