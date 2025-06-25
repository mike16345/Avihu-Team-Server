const { execSync } = require("child_process");
const dotenv = require("dotenv");
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const { setupAliases } = require("./scripts/setupAliases");
const sleep=require('./scripts/utils')

const { lambdaConfig } = require("./config/lambdaConfig");

dotenv.config({ path: "./.env.local" });

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("env="));
const promote = args.includes("promote");

const REGION = "il-central-1";
const lambdaFolder = "./src/functions";

// ENV variables

// DB
const DB_NAME = `DB_NAME=${process.env.DB_NAME}`;
const MONGO_URI = `MONGO_URI=${process.env.MONGO_URI}`;

// AWS
const AWS_BUCKET = `AWS_BUCKET=${process.env.AWS_BUCKET}`;
const AWS_REGION = `AWS_REGION=${process.env.AWS_REGION}`;
const ACCESS_KEY = `ACCESS_KEY=${process.env.ACCESS_KEY}`;
const ACCESS_SECRET = `SECRET_KEY=${process.env.SECRET_KEY}`;

// Email
const EMAIL = `EMAIL=${process.env.EMAIL}`;
const APP_PASSWORD = `APP_PASSWORD=${process.env.APP_PASSWORD}`;

const signedUrlEnv = `${AWS_BUCKET},${AWS_REGION},${ACCESS_KEY},${ACCESS_SECRET}`;
const apiEnv = `${DB_NAME},${MONGO_URI}`;
const envMap = {
  signedUrl: signedUrlEnv,
  api: apiEnv,
  otp: `${EMAIL},${APP_PASSWORD},${apiEnv}`,
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
      `aws lambda list-functions --region ${REGION} --query "Functions[*].FunctionName" --output json`
    );
    return JSON.parse(result);
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

    await sleep(2000)

    setupAliases(functionName, promote);

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
