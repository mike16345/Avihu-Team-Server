const { deploy } = require("./deploy");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: "./.env.local" });

const lambdaFolder = "./src/functions";

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
  LessonGroups: { path: "lessonGroups/index.ts", envToUse: "api" },

};

async function deployAllLambdas() {
  for (const [functionName, { path: handlerPath, envToUse }] of Object.entries(
    lambdaFunctionsMap
  )) {
    const selectedHandlerPath = path.join(lambdaFolder, handlerPath);

    if (!fs.existsSync(selectedHandlerPath)) {
      console.error(`Handler file for ${functionName} not found: ${selectedHandlerPath}`);
      continue; // Skip this lambda if handler file doesn't exist
    }

    try {
      deploy({ functionName, handlerPath: selectedHandlerPath }, envToUse);
    } catch (e) {
      console.log("Error deploying Lambda: ", e.message);
    }
  }

  console.log("Deployment of all lambdas completed.");
  process.exit(0);
}

deployAllLambdas();
