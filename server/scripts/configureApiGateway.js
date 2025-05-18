const { execSync } = require("child_process");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env.local" });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const apiId = process.env.API_ID;
const parentResourceId = process.env.PARENT_RESOURCE_ID;
const authorizerId = process.env.AUTHORIZER_ID;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (key) => {
  const arg = args.find((arg) => arg.startsWith(key));
  return arg ? arg.split("=")[1] : null;
};

const resourcePath = getArg("path");
const functionName = getArg("function");
const proxyEnabled = getArg("proxy") === "true";

console.log("📦 args", args);
console.log("📂 path", resourcePath);
console.log("🧠 name", functionName);
console.log("proxyEnabled", proxyEnabled);

function run(command) {
  return execSync(command, { encoding: "utf-8" }).trim();
}

function enableCors(apiId, resourceId) {
  const mockIntegrationCmd =
    `aws apigateway put-integration ` +
    `--rest-api-id ${apiId} ` +
    `--resource-id ${resourceId} ` +
    `--http-method OPTIONS ` +
    `--type MOCK ` +
    `--request-templates "{\\"application/json\\": \\"{\\\\\\"statusCode\\\\\\": 200}\\"}"`;

  const methodResponseCmd = `aws apigateway put-method-response \
    --rest-api-id ${apiId} \
    --resource-id ${resourceId} \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Origin=true,method.response.header.Access-Control-Allow-Methods=true`;

  const integrationResponseCmd = `aws apigateway put-integration-response \
    --rest-api-id ${apiId} \
    --resource-id ${resourceId} \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers="'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",\
    method.response.header.Access-Control-Allow-Origin="'*'"`;

  console.log("🌐 Enabling CORS...");

  // 1. Add OPTIONS method
  run(
    `aws apigateway put-method --rest-api-id ${apiId} --resource-id ${resourceId} --http-method OPTIONS --authorization-type "NONE"`
  );

  // 2. Add MOCK integration
  run(mockIntegrationCmd);

  console.log("Created mock integration...");

  // 3. Add method response headers
  run(methodResponseCmd);

  console.log("Created put method response...");

  // 4. Add integration response headers
  // run(integrationResponseCmd);

  console.log("Created integration response...");

  console.log("✅ CORS enabled");
}

function createResource(apiId, parentResourceId, path) {
  console.log(`📁 Creating resource "${path}"...`);
  return run(
    `aws apigateway create-resource --rest-api-id ${apiId} --parent-id ${parentResourceId} --path-part ${path} --query id --output text`
  );
}

function setupAuthorization(apiId, resourceId, authorizerId) {
  console.log("🔐 Setting up lambda authorization...");
  run(
    `aws apigateway put-method --rest-api-id ${apiId} --resource-id ${resourceId} --http-method ANY --authorization-type CUSTOM --authorizer-id ${authorizerId}`
  );
}

function setupIntegration(apiId, resourceId, functionName) {
  console.log("🔗 Setting up integration with stage variable for alias...");
  const uri = `arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${functionName}:\${stageVariables.lambdaAlias}/invocations`;

  run(
    `aws apigateway put-integration --rest-api-id ${apiId} --resource-id ${resourceId} --http-method ANY --type AWS_PROXY --integration-http-method POST --uri "${uri}"`
  );
}

function addLambdaPermission(apiId, resourceId, resourcePath, functionName, alias) {
  const statementId = `apigateway-${apiId}-${resourceId}-${alias}`;

  // Normalize resourcePath: replace {proxy+} with * for correct wildcard match
  const normalizedPath = resourcePath === "{proxy+}" ? "*" : resourcePath;

  const sourceArn = `arn:aws:execute-api:${AWS_REGION}:${AWS_ACCOUNT_ID}:${apiId}/*/ANY/${normalizedPath}`;

  console.log(`🛡️  Granting permission for alias "${alias}" on path "${resourcePath}"...`);
  try {
    run(
      `aws lambda add-permission --function-name ${functionName}:${alias} --statement-id ${statementId} --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn ${sourceArn}`
    );
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log(`⚠️ Permission "${statementId}" already exists. Skipping.`);
    } else {
      throw err;
    }
  }
}

async function createProxyResource(apiId, parentId) {
  const proxyPath = "{proxy+}";
  console.log(`📁 Creating greedy path "/${proxyPath}"...`);

  const proxyId = run(
    `aws apigateway create-resource --rest-api-id ${apiId} --parent-id ${parentId} --path-part ${proxyPath} --query id --output text`
  );

  setupAuthorization(apiId, proxyId, authorizerId);
  setupIntegration(apiId, proxyId, functionName);

  await sleep(2000);
  addLambdaPermission(apiId, proxyId, proxyPath, functionName, "dev");
  await sleep(1000);
  addLambdaPermission(apiId, proxyId, proxyPath, functionName, "prod");

  console.log(`✅ Created proxy resource "/${proxyPath}" with ID ${proxyId}`);
}

function deployStage(apiId, stageName) {
  console.log(`🚀 Deploying to stage "${stageName}"...`);
  run(`aws apigateway create-deployment --rest-api-id ${apiId} --stage-name ${stageName}`);
  console.log(`✅ Deployed to "${stageName}"`);
}

function rollbackResource(apiId, resourceId) {
  try {
    console.log("⏪ Rolling back...");
    run(`aws apigateway delete-resource --rest-api-id ${apiId} --resource-id ${resourceId}`);
    console.log(`🗑️ Deleted resource ${resourceId}`);
  } catch {
    console.error(`⚠️ Failed to delete resource ${resourceId}`);
  }
}

async function configureGateway() {
  if (!resourcePath || !functionName) {
    console.error("❌ Missing required parameters: 'path' and 'function'");
    process.exit(1);
  }

  let newResourceId = "";

  try {
    newResourceId = createResource(apiId, parentResourceId, resourcePath);
    console.log(`✅ Created resource "${resourcePath}" with ID ${newResourceId}`);

    if (proxyEnabled) {
      createProxyResource(apiId, newResourceId);
    }

    await sleep(3000); // 🔁 Wait 2 seconds before second deployment

    setupAuthorization(apiId, newResourceId, authorizerId);
    setupIntegration(apiId, newResourceId, functionName);

    addLambdaPermission(apiId, newResourceId, resourcePath, functionName, "dev"); // test
    await sleep(3000); // 🔁 Wait 2 seconds before second deployment

    addLambdaPermission(apiId, newResourceId, resourcePath, functionName, "prod"); // prod
    await sleep(3000); // 🔁 Wait 2 seconds before second deployment

    await deployStage(apiId, "test");
    await sleep(5000); // 🔁 Wait 2 seconds before second deployment
    await deployStage(apiId, "prod");

    console.log(`🎉 Successfully configured API Gateway for "/${resourcePath}"`);
  } catch (err) {
    console.error("❌ Error during API Gateway setup:", err.message);
    rollbackResource(apiId, newResourceId);
    process.exit(1);
  }
}

configureGateway();

module.exports = {
  addLambdaPermission,
};
