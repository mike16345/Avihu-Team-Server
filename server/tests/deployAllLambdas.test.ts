const path = require("path");

const {
  findLambdaConfigMismatches,
  getLambdaHandlerEntries,
  ignoredLambdaFolders,
} = require("../deployAllLambdas");

describe("deployAllLambdas config coverage", () => {
  const functionsFolder = path.join(__dirname, "..", "src", "functions");

  test("includes every deployable lambda folder in the deploy config", () => {
    const { missingConfig, extraConfig } = findLambdaConfigMismatches(functionsFolder);

    expect(missingConfig).toEqual([]);
    expect(extraConfig).toEqual([]);
  });

  test("skips ignored lambda folders when building the deploy list", () => {
    const handlerEntries = getLambdaHandlerEntries(functionsFolder);
    const ignoredFolders = handlerEntries.filter((handlerEntry: { folderName: string }) =>
      ignoredLambdaFolders.has(handlerEntry.folderName)
    );

    expect(ignoredFolders).toEqual([]);
  });
});
