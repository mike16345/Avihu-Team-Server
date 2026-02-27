const { deploy } = require("./deploy");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const lambdaFunctionsMap = require("./config/lambdas.json");

dotenv.config({ path: "./.env.local" });

const lambdaFolder = path.join(__dirname, "src", "functions");
const ignoredLambdaFolders = new Set(["test"]);

function getLambdaHandlerEntries(folder = lambdaFolder) {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !ignoredLambdaFolders.has(entry.name))
    .map((entry) => {
      const tsHandlerPath = path.join(folder, entry.name, "index.ts");
      const jsHandlerPath = path.join(folder, entry.name, "index.js");

      if (fs.existsSync(tsHandlerPath)) {
        return { folderName: entry.name, handlerPath: tsHandlerPath };
      }

      if (fs.existsSync(jsHandlerPath)) {
        return { folderName: entry.name, handlerPath: jsHandlerPath };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.folderName.localeCompare(b.folderName));
}

function findLambdaConfigMismatches(
  folder = lambdaFolder,
  lambdaDefinitions = lambdaFunctionsMap
) {
  const handlerEntries = getLambdaHandlerEntries(folder);
  const discoveredFolders = handlerEntries.map(({ folderName }) => folderName);
  const configuredFolders = Object.keys(lambdaDefinitions);

  return {
    handlerEntries,
    missingConfig: discoveredFolders.filter((folderName) => !lambdaDefinitions[folderName]),
    extraConfig: configuredFolders.filter((folderName) => !discoveredFolders.includes(folderName)),
  };
}

async function deployAllLambdas() {
  const { handlerEntries, missingConfig, extraConfig } = findLambdaConfigMismatches();

  if (missingConfig.length > 0 || extraConfig.length > 0) {
    const mismatchMessages = [];

    if (missingConfig.length > 0) {
      mismatchMessages.push(
        `Missing deploy config for folders: ${missingConfig.join(", ")}`
      );
    }

    if (extraConfig.length > 0) {
      mismatchMessages.push(
        `Deploy config references missing folders: ${extraConfig.join(", ")}`
      );
    }

    throw new Error(mismatchMessages.join("\n"));
  }

  for (const { folderName, handlerPath } of handlerEntries) {
    const { functionName, envToUse } = lambdaFunctionsMap[folderName];

    try {
      await deploy({ functionName, handlerPath }, envToUse);
    } catch (error) {
      console.log("Error deploying Lambda: ", error.message);
    }
  }

  console.log("Deployment of all lambdas completed.");
  process.exit(0);
}

if (require.main === module) {
  deployAllLambdas().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  deployAllLambdas,
  findLambdaConfigMismatches,
  getLambdaHandlerEntries,
  ignoredLambdaFolders,
  lambdaFunctionsMap,
};
