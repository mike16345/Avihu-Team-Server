const { execSync } = require("child_process");

// Helper: Publish a new version and return the version number
function publishVersion(functionName) {
  console.log(`Publishing version for function: ${functionName}`);
  const publishOutput = execSync(
    `aws lambda publish-version --function-name ${functionName} --region il-central-1`,
    { encoding: "utf-8" }
  );
  const version = JSON.parse(publishOutput).Version;
  console.log(`Published version: ${version}`);
  return version;
}

// Helper: Check if an alias exists
function aliasExists(functionName, alias) {
  try {
    execSync(
      `aws lambda get-alias --function-name ${functionName} --name ${alias} --region il-central-1`,
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

// Helper: Create alias pointing to a version
function createAlias(functionName, aliasName, version) {
  console.log(`Creating alias '${aliasName}' pointing to version ${version}`);
  execSync(
    `aws lambda create-alias --function-name ${functionName} --name ${aliasName} --function-version ${version} --region il-central-1`
  );
}

// Helper: Update alias to point to a version
function updateAlias(functionName, aliasName, version) {
  console.log(`Updating alias '${aliasName}' to point to version ${version}`);
  execSync(
    `aws lambda update-alias --function-name ${functionName} --name ${aliasName} --function-version ${version} --region il-central-1`
  );
}

// Main function
function setupAliases(functionName, promote = false) {
  const version = publishVersion(functionName);

  // dev always points to latest version
  if (!aliasExists(functionName, "dev")) {
    createAlias(functionName, "dev", version);
  } else {
    updateAlias(functionName, "dev", version);
  }

  // prod points to version only if --promote is passed
  const prodExists = aliasExists(functionName, "prod");

  if (!prodExists) {
    createAlias(functionName, "prod", version);
    console.log("Created 'prod' alias pointing to new version.");
  } else if (promote) {
    updateAlias(functionName, "prod", version);
  } else {
    console.log("Skipping 'prod' alias update (use --promote to update).");
  }

  console.log("Alias setup completed.");
  return version;
}

module.exports = {
  setupAliases,
  publishVersion,
  aliasExists,
  createAlias,
  updateAlias,
};
