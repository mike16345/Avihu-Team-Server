const { execSync } = require("child_process");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: "./.env.local" });

const lambdaFolder = "./src/functions";
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

// Convert environment variables string to AWS CLI format
const envVars = `${DB_NAME},${DB_USER},${DB_PASSWORD},${DB_CLUSTER}`;
const otpEnv = `${EMAIL},${APP_PASSWORD},` + envVars;
const signedUrlEnv = `${AWS_BUCKET},${AWS_REGION},${ACCESS_KEY},${ACCESS_SECRET}`;

const envMap = {
  signedUrl: signedUrlEnv,
  api: envVars,
  otp: otpEnv,
};

const lambdaFunctionsMap = {
  Blogs: { path: "blogs/index.ts", envToUse: "api" },
  weighIns: { path: "weighIns/index.ts", envToUse: "api" },
  RecordedSets: { path: "recordedSets/index.ts", envToUse: "api" },
  Analytics: { path: "analytics/index.ts", envToUse: "api" },
  UserImageUrls: { path: "UserImageUrls/index.ts", envToUse: "api" },
  Users: { path: "users/index.ts", envToUse: "otp" },
  WorkoutPlans: { path: "workoutPlans/index.ts", envToUse: "api" },
  Presets: { path: "presets/index.ts", envToUse: "api" },
  muscleGroups: { path: "muscleGroups/index.ts", envToUse: "api" },
  OTP: { path: "OneTimePassword/index.ts", envToUse: "otp" },
  menuItems: { path: "menuItems/index.ts", envToUse: "api" },
  Password: { path: "Password/index.ts", envToUse: "api" },
  GenerateSignedURL: { path: "signedUrl/index.ts", envToUse: "signedUrl" },
  DietPlans: { path: "dietPlans/index.ts", envToUse: "api" },
  Sessions: { path: "sessions/index.ts", envToUse: "api" },
  S3Actions: { path: "S3/index.ts", envToUse: "signedUrl" },
};

async function deployAllLambdas() {
  // Loop through the lambda map and deploy each one
  for (const [functionName, { path: handlerPath, envToUse }] of Object.entries(
    lambdaFunctionsMap
  )) {
    const selectedHandlerPath = path.join(lambdaFolder, handlerPath);

    if (!fs.existsSync(selectedHandlerPath)) {
      console.error(`Handler file for ${functionName} not found: ${selectedHandlerPath}`);
      continue; // Skip this lambda if handler file doesn't exist
    }

    const command = `lambda-build upload ${functionName} -e ${selectedHandlerPath} -r il-central-1`;
    const updateEnvCommand = `aws lambda update-function-configuration --function-name ${functionName} --timeout 10 --environment Variables="{${envMap[envToUse]}}" --region il-central-1`;

    try {
      console.log(
        `Updating environment variables for ${functionName} with command: ${updateEnvCommand}`
      );
      execSync(updateEnvCommand);

      console.log(`Deploying Lambda function ${functionName} using command: ${command}`);
      execSync(command, { stdio: "inherit" });
    } catch (error) {
      console.error(`Deployment of ${functionName} failed:`, error.message);
    }
  }

  console.log("Deployment of all lambdas completed.");
  process.exit(0);
}

deployAllLambdas();
