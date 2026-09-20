const {
  buildLambdaIntegrationUri,
  putLambdaIntegration,
} = require("../scripts/apiGatewayIntegration");

describe("API Gateway Lambda integration", () => {
  it("passes the stage variable literally without shell expansion", () => {
    const execute = jest.fn(() => Buffer.from(""));

    putLambdaIntegration(
      {
        apiId: "api-id",
        resourceId: "resource-id",
        functionName: "FoodCatalog",
        region: "il-central-1",
        accountId: "123456789012",
      },
      execute
    );

    expect(execute).toHaveBeenCalledWith(
      "aws",
      expect.arrayContaining([
        "--uri",
        buildLambdaIntegrationUri(
          "il-central-1",
          "123456789012",
          "FoodCatalog"
        ),
      ]),
      { encoding: "utf-8" }
    );
    expect(buildLambdaIntegrationUri("il-central-1", "123456789012", "FoodCatalog"))
      .toBe(
        "arn:aws:apigateway:il-central-1:lambda:path/2015-03-31/functions/arn:aws:lambda:il-central-1:123456789012:function:FoodCatalog:${stageVariables.lambdaAlias}/invocations"
      );
  });
});
