const { execSync } = require("child_process");
const dotenv = require("dotenv");
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const { setupAliases } = require("./scripts/setupAliases");
const sleep = require("./scripts/utils");

const { lambdaConfig } = require("./config/lambdaConfig");

dotenv.config({ path: "./.env.local" });

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("env="));
const promote = args.includes("promote");
const ignoreDev = args.includes("ignoreDev");

const REGION = "il-central-1";
const lambdaFolder = "./src/functions";

// ENV variables

// DB
const DB_NAME_DEV = `DB_NAME_DEV=${process.env.DB_NAME_DEV}`;
const DB_NAME_PROD = `DB_NAME_PROD=${process.env.DB_NAME_PROD}`;
const MONGO_URI = `MONGO_URI=${process.env.MONGO_URI}`;

// AWS
const AWS_BUCKET = `AWS_BUCKET=${process.env.AWS_BUCKET}`;
const AMAZON_REGION = `AMAZON_REGION=${process.env.AMAZON_REGION}`;
const ACCESS_KEY = `ACCESS_KEY=${process.env.ACCESS_KEY}`;
const ACCESS_SECRET = `SECRET_KEY=${process.env.SECRET_KEY}`;

// Email
const EMAIL = `EMAIL=${process.env.EMAIL}`;
const APP_PASSWORD = `APP_PASSWORD=${process.env.APP_PASSWORD}`;

// RAG
const OPEN_AI_KEY = `OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`;
const PINECONE_API_KEY = `PINECONE_API_KEY=${process.env.PINECONE_API_KEY}`;
const PINECONE_INDEX = `PINECONE_INDEX=${process.env.PINECONE_INDEX}`;
const JWT_ACCESS_SECRET = `JWT_ACCESS_SECRET=${process.env.JWT_ACCESS_SECRET}`;
const JWT_ACCESS_EXPIRES_IN = `JWT_ACCESS_EXPIRES_IN=${process.env.JWT_ACCESS_EXPIRES_IN}`;
const JWT_REFRESH_EXPIRES_IN_MS = `JWT_REFRESH_EXPIRES_IN_MS=${process.env.JWT_REFRESH_EXPIRES_IN_MS}`;

const AVIHU_TRAINER_ID = `AVIHU_TRAINER_ID=${process.env.AVIHU_TRAINER_ID}`;

const JWT_ENV = `${JWT_ACCESS_SECRET},${JWT_ACCESS_EXPIRES_IN},${JWT_REFRESH_EXPIRES_IN_MS}`;
const signedUrlEnv = `${AWS_BUCKET},${AMAZON_REGION},${ACCESS_KEY},${ACCESS_SECRET}`;
const apiEnv = `${DB_NAME_DEV},${DB_NAME_PROD},${MONGO_URI},${JWT_ENV},${AVIHU_TRAINER_ID}`;
const ragEnv = `${OPEN_AI_KEY},${PINECONE_API_KEY},${PINECONE_INDEX}`;
const envMap = {
  signedUrl: `${signedUrlEnv},${apiEnv}`,
  api: apiEnv,
  otp: `${EMAIL},${APP_PASSWORD},${apiEnv}`,
  rag: `${ragEnv},${apiEnv}`,
};

// Get all index.ts/js files in subfolders
function getLambdaHandlers(folder) {
  let handlers = [];
  const items = fs.readdirSync(folder);

  items.forEach((item) => {
    const fullPath = path.join(folder, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      handlers = handlers.concat(getLambdaHandlers(fullPath));
    } else if (stat.isFile() && (item === "index.ts" || item === "index.js")) {
      handlers.push(fullPath);
    }
  });

  return handlers;
}

function getLambdaFunctions() {
  try {
    const result = execSync(
      `aws lambda list-functions --region ${REGION} --query "Functions[*].FunctionName" --output json`,
      { encoding: "utf8" }
    );

    const parsed = JSON.parse(result);

    return parsed.sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to list Lambda functions:", error.message);
    process.exit(1);
  }
}

async function deploy({ functionName, handlerPath }, envKey = null) {
  const envToUse = envKey || envArg.split("=")[1];
  const updateEnvCommand = `aws lambda update-function-configuration --function-name ${functionName} --timeout ${lambdaConfig.timeout} --environment Variables="{${envMap[envToUse]}}" --region ${REGION}`;
  const uploadCommand = `lambda-build upload ${functionName} -e ${handlerPath} -r ${REGION}`;

  try {
    console.log(`Updating environment with ${envToUse} env variables...`);
    execSync(updateEnvCommand);

    console.log(`Uploading code with lambda-build...`);
    execSync(uploadCommand, { stdio: "inherit" });

    await sleep(2000);

    setupAliases(functionName, promote, ignoreDev);

    console.log("✅ Deployment complete.");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

async function promptAndDeployLambda() {
  const lambdaHandlers = getLambdaHandlers(lambdaFolder);
  if (lambdaHandlers.length === 0) {
    console.error("No Lambda handlers found in the folder.");
    process.exit(1);
  }

  const handlerChoices = lambdaHandlers.map((handler) => path.relative(lambdaFolder, handler));
  const lambdaFunctions = getLambdaFunctions();

  const { selectedHandler, selectedFunction } = await inquirer.default.prompt([
    {
      type: "list",
      name: "selectedFunction",
      message: "Select a Lambda function to update:",
      choices: lambdaFunctions,
      pageSize: 20,
    },
    {
      type: "list",
      name: "selectedHandler",
      message: "Select a Lambda handler to deploy:",
      choices: handlerChoices,
      pageSize: 20,
    },
  ]);

  const selectedHandlerPath = path.join(lambdaFolder, selectedHandler);
  deploy({ functionName: selectedFunction, handlerPath: selectedHandlerPath });
}

if (require.main === module) {
  if (!envArg) {
    console.error(
      "Please provide an environment using the 'env=' argument\nUsage: npm run deploy -- env='your-env' [--promote]\nOptions:\n1. signedUrl\n2. api\n3. otp"
    );
    process.exit(1);
  }
  promptAndDeployLambda();
}

module.exports = { deploy };
