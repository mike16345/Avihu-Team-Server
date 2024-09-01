const { execSync } = require("child_process");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: npm run deploy -- [function-name] [file-path] ");
  console.error("Example: npm run deploy -- test-upload .\\src\\users\\index.js");
  process.exit(1);
}

const functionName = args[0];
const filePath = args[1];
const DB_NAME = `DB_NAME=${process.env.DB_NAME}`;
const DB_USER = `DB_USERNAME=${process.env.DB_USERNAME}`;
const DB_PASSWORD = `DB_PASSWORD=${process.env.DB_PASSWORD}`;
const DB_CLUSTER = `DB_CLUSTER=${process.env.DB_CLUSTER}`;

// Convert environment variables string to AWS CLI format
const envVars = `${DB_NAME}, ${DB_USER}, ${DB_PASSWORD}, ${DB_CLUSTER}`;

// Construct the command to upload the Lambda function
const command = `lambda-build upload ${functionName} -e ${filePath} -r il-central-1`;

// Construct the command to update the Lambda function's environment variables
const updateEnvCommand = `aws lambda update-function-configuration --function-name ${functionName} --environment Variables="{${envVars}}" --region il-central-1`;

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
