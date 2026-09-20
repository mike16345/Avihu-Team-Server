const { execFileSync } = require("child_process");

function buildLambdaIntegrationUri(region, accountId, functionName) {
  return `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:${functionName}:\${stageVariables.lambdaAlias}/invocations`;
}

function putLambdaIntegration(options, execute = execFileSync) {
  const { apiId, resourceId, functionName, region, accountId } = options;
  const uri = buildLambdaIntegrationUri(region, accountId, functionName);

  return execute(
    "aws",
    [
      "apigateway",
      "put-integration",
      "--rest-api-id",
      apiId,
      "--resource-id",
      resourceId,
      "--http-method",
      "ANY",
      "--type",
      "AWS_PROXY",
      "--integration-http-method",
      "POST",
      "--uri",
      uri,
    ],
    { encoding: "utf-8" }
  ).toString().trim();
}

module.exports = {
  buildLambdaIntegrationUri,
  putLambdaIntegration,
};
