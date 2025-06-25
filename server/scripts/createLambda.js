const { execSync } = require("child_process");
const { setupAliases } = require("./setupAliases");
const path = require("path");
const dotenv = require("dotenv");

const { lambdaConfig } = require("./config/lambdaConfig");

dotenv.config({ path: "./.env.local" });

// Constants (same as the batch script)
const RUNTIME = "nodejs20.x";
const HANDLER = "index.handler";
const ZIP_FILE = path.resolve("./scripts/archive.zip");
const ROLE_ARN = `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/BasicLambdaRole`;
const REGION = process.env.AMAZON_REGION;

const { lambdaConfig } = require("../config/lambdaConfig");

// Get function name from command-line argument
const args = process.argv.slice(2);
const FUNCTION_NAME = args[0];

if (!FUNCTION_NAME) {
  console.error("Usage: node createLambda.js FUNCTION_NAME");
  process.exit(1);
}

try {
  console.log(`Creating Lambda function "${FUNCTION_NAME}" in region ${REGION}...`);

  const command = `aws lambda create-function \
    --function-name ${FUNCTION_NAME} \
    --runtime ${RUNTIME} \
    --role ${ROLE_ARN} \
    --handler ${HANDLER} \
    --zip-file fileb://${ZIP_FILE} \
    --timeout ${lambdaConfig.timeout} \
    --region ${REGION}`;

  execSync(command, { stdio: "ignore" });

  console.log(`\n✅ Lambda function "${FUNCTION_NAME}" created successfully.`);
  setupAliases(FUNCTION_NAME);
} catch (error) {
  console.error(`\n❌ Failed to create Lambda function "${FUNCTION_NAME}".`);
  console.error(error.message);
  process.exit(1);
}
