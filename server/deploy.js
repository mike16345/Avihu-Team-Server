const { execSync } = require("child_process");
const dotenv = require("dotenv");
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: "./.env.local" });

const lambdaFolder = "./src/functions";

const DB_NAME = `DB_NAME=${process.env.DB_NAME}`;
const DB_USER = `DB_USERNAME=${process.env.DB_USERNAME}`;
const DB_PASSWORD = `DB_PASSWORD=${process.env.DB_PASSWORD}`;
const DB_CLUSTER = `DB_CLUSTER=${process.env.DB_CLUSTER}`;

// Convert environment variables string to AWS CLI format
const envVars = `${DB_NAME},${DB_USER},${DB_PASSWORD},${DB_CLUSTER}`;

// Function to recursively get all Lambda handlers (files) from the root folder and subfolders
function getLambdaHandlers(folder) {
  let handlers = [];
  const items = fs.readdirSync(folder);

  items.forEach((item) => {
    const fullPath = path.join(folder, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // If it's a directory, recurse into it
      handlers = handlers.concat(getLambdaHandlers(fullPath));
    } else if (stat.isFile() && (item === "index.ts" || item === "index.js")) {
      // If it's an index.ts or index.js file, add to the list
      handlers.push(fullPath);
    }
  });

  return handlers;
}

function getLambdaFunctions() {
  try {
    const result = execSync(
      'aws lambda list-functions --query "Functions[*].FunctionName" --output json'
    );
    return JSON.parse(result);
  } catch (error) {
    console.error("Failed to list Lambda functions:", error.message);
    process.exit(1);
  }
}

async function deployLambda() {
  const lambdaHandlers = getLambdaHandlers(lambdaFolder);
  if (lambdaHandlers.length === 0) {
    console.error("No Lambda handlers found in the folder.");
    process.exit(1);
  }

  // Map the handlers to display relative paths in the prompt
  const handlerChoices = lambdaHandlers.map((handler) => path.relative(lambdaFolder, handler));
  const lambdaFunctions = getLambdaFunctions();

  // Prompt the user to select a Lambda handler
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

  const command = `lambda-build upload ${selectedFunction} -e ${selectedHandlerPath} -r il-central-1`;
  const updateEnvCommand = `aws lambda update-function-configuration --function-name ${selectedFunction} --timeout 10 --environment Variables="{${envVars}}" --region il-central-1`;

  try {
    console.log(`Updating environment variables with command: ${updateEnvCommand}`);
    execSync(updateEnvCommand);

    console.log(`Running command: ${command}`);
    execSync(command, { stdio: "inherit" });
    process.exit(0);
  } catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }
}

deployLambda();
