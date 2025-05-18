const { execSync } = require("child_process");
const dotenv = require("dotenv");
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const { setupAliases } = require("./scripts/setupAliases");

dotenv.config({ path: "./.env.local" });

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("env="));
const promote = args.includes("promote");

if (!envArg) {
  console.error(
    "Please provide an environment using the 'env=' argument\nUsage: npm run deploy -- env='your-env' [--promote]\nOptions:\n1. signedUrl\n2. api\n3. otp"
  );
  process.exit(1);
}

const env = envArg.split("=")[1];
const REGION = "il-central-1";
const lambdaFolder = "./src/functions";

// ENV variables
const DB_NAME = `DB_NAME=${process.env.DB_NAME}`;
const DB_USER = `DB_USERNAME=${process.env.DB_USERNAME}`;
const DB_PASSWORD = `DB_PASSWORD=${process.env.DB_PASSWORD}`;
const DB_CLUSTER = `DB_CLUSTER=${process.env.DB_CLUSTER}`;
const AWS_BUCKET = `AWS_BUCKET=${process.env.AWS_BUCKET}`;
const AWS_REGION = `REGION=${process.env.REGION}`;
const EMAIL = `EMAIL=${process.env.EMAIL}`;
const APP_PASSWORD = `APP_PASSWORD=${process.env.APP_PASSWORD}`;
const ACCESS_KEY = `ACCESS_KEY=${process.env.ACCESS_KEY}`;
const ACCESS_SECRET = `SECRET_KEY=${process.env.SECRET_KEY}`;

const envMap = {
  signedUrl: `${AWS_BUCKET},${AWS_REGION},${ACCESS_KEY},${ACCESS_SECRET}`,
  api: `${DB_NAME},${DB_USER},${DB_PASSWORD},${DB_CLUSTER}`,
  otp: `${EMAIL},${APP_PASSWORD},${DB_NAME},${DB_USER},${DB_PASSWORD},${DB_CLUSTER}`,
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

function aliasExists(functionName, aliasName) {
  try {
    execSync(
      `aws lambda get-alias --function-name ${functionName} --name ${aliasName} --region ${REGION}`,
      { stdio: "ignore" }
    );
    return true;
  } catch (error) {
    return false;
  }
}

function updateOrCreateAlias(functionName, aliasName, version) {
  if (aliasExists(functionName, aliasName)) {
    console.log(`Updating alias '${aliasName}' to version ${version}...`);
    execSync(
      `aws lambda update-alias --function-name ${functionName} --name ${aliasName} --function-version ${version} --region ${REGION}`
    );
  } else {
    console.log(`Creating alias '${aliasName}' to version ${version}...`);
    execSync(
      `aws lambda create-alias --function-name ${functionName} --name ${aliasName} --function-version ${version} --region ${REGION}`
    );
  }
}

async function deployLambda() {
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
  const updateEnvCommand = `aws lambda update-function-configuration --function-name ${selectedFunction} --timeout 10 --environment Variables="{${envMap[env]}}" --region ${REGION}`;
  const uploadCommand = `lambda-build upload ${selectedFunction} -e ${selectedHandlerPath} -r ${REGION}`;

  try {
    console.log(`Updating environment variables...`);
    execSync(updateEnvCommand);

    console.log(`Uploading code with lambda-build...`);
    execSync(uploadCommand, { stdio: "inherit" });

    setupAliases(selectedFunction, promote);

    console.log("✅ Deployment complete.");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

deployLambda();
