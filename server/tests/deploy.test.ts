describe("deploy env resolution", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    jest.resetModules();
  });

  test("uses the lambda config env when no explicit env is provided", () => {
    const { resolveEnvToUse } = require("../deploy");

    expect(resolveEnvToUse("Users")).toBe("otp");
    expect(resolveEnvToUse("Agreements")).toBe("signedUrl");
    expect(resolveEnvToUse("FoodCatalog")).toBe("foodCatalog");
  });

  test("prefers the explicit env override when provided", () => {
    const { resolveEnvToUse } = require("../deploy");

    expect(resolveEnvToUse("Users", "api")).toBe("api");
  });

  test("throws when the lambda function is not mapped in lambdas.json", () => {
    const { resolveEnvToUse } = require("../deploy");

    expect(() => resolveEnvToUse("MissingLambda")).toThrow(
      'No envToUse mapping found for Lambda function "MissingLambda" in config/lambdas.json'
    );
  });

  test("reads env= from argv as a fallback override", () => {
    process.argv = [...originalArgv, "env=rag"];
    jest.resetModules();

    const { resolveEnvToUse } = require("../deploy");

    expect(resolveEnvToUse("Users")).toBe("rag");

    process.argv = originalArgv;
  });

  test("builds lambda choices from lambdas.json with env labels", () => {
    const { getLambdaFunctions } = require("../deploy");

    expect(getLambdaFunctions()).toEqual(
      expect.arrayContaining([
        { name: "Users (otp)", value: "Users" },
        { name: "Agreements (signedUrl)", value: "Agreements" },
      ])
    );
  });
});
