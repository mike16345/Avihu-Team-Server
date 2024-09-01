const { execSync } = require("child_process");

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: npm run deploy -- [function-name] [file-path]");
  process.exit(1);
}

const functionName = args[0];
const filePath = args[1];

// Construct the command
const command = `lambda-build upload ${functionName} -e ${filePath} -r il-central-1`;

try {
  console.log(`Running command: ${command}`);
  execSync(command, { stdio: "inherit" });
  console.log("Deployment successful!");
} catch (error) {
  console.error("Deployment failed:", error.message);
  process.exit(1);
}
