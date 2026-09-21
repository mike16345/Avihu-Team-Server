const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  createLambda,
  getLambdaHandlers,
  resolveFunctionName,
  selectLambdaHandler,
} = require("../scripts/createLambda");

describe("createLambda tooling", () => {
  test("discovers nested TypeScript and JavaScript handlers in stable order", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "lambda-handlers-test-"));
    fs.mkdirSync(path.join(root, "zeta"));
    fs.mkdirSync(path.join(root, "alpha", "nested"), { recursive: true });
    fs.writeFileSync(path.join(root, "zeta", "index.js"), "exports.handler = () => {};");
    fs.writeFileSync(path.join(root, "alpha", "nested", "index.ts"), "export const handler = 1;");
    fs.writeFileSync(path.join(root, "alpha", "ignored.ts"), "export {};");

    try {
      expect(getLambdaHandlers(root)).toEqual([
        path.join(root, "alpha", "nested", "index.ts"),
        path.join(root, "zeta", "index.js"),
      ]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("uses a valid CLI function name without prompting and prompts when absent", async () => {
    const prompt = jest.fn().mockResolvedValue({ functionName: "PromptedLambda" });

    await expect(resolveFunctionName("FoodCatalog", prompt)).resolves.toBe("FoodCatalog");
    expect(prompt).not.toHaveBeenCalled();
    await expect(resolveFunctionName(undefined, prompt)).resolves.toBe("PromptedLambda");
  });

  test("shows readable relative handler choices and returns the selected absolute path", async () => {
    const root = path.resolve("src/functions");
    const handlers = [
      path.join(root, "foodCatalog", "index.ts"),
      path.join(root, "users", "index.ts"),
    ];
    const prompt = jest.fn().mockResolvedValue({ selectedHandler: "foodCatalog/index.ts" });

    await expect(selectLambdaHandler(handlers, root, prompt)).resolves.toBe(handlers[0]);
    expect(prompt.mock.calls[0][0][0].choices).toEqual(["foodCatalog/index.ts", "users/index.ts"]);
  });

  test("builds a temporary archive, creates the Lambda from it, sets aliases, and cleans up", async () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "create-lambda-test-"));
    const handlerPath = path.resolve("src/functions/foodCatalog/index.ts");
    const calls: Array<{ file: string; args: string[]; cwd?: string }> = [];
    const execFileSync = jest.fn((file: string, args: string[], options: any) => {
      calls.push({ file, args, cwd: options?.cwd });
      if (args[0] === "archive") {
        fs.writeFileSync(path.join(options.cwd, "archive.zip"), "zip");
      }
    });
    const setupAliases = jest.fn();

    await createLambda(
      { functionName: "FoodCatalog", handlerPath },
      {
        execFileSync,
        setupAliases,
        createTemporaryDirectory: () => temporaryDirectory,
        lambdaBuildBinary: "/project/node_modules/.bin/lambda-build",
        roleArn: "arn:aws:iam::123:role/BasicLambdaRole",
        region: "il-central-1",
        timeout: 30,
      }
    );

    expect(calls[0]).toEqual({
      file: "/project/node_modules/.bin/lambda-build",
      args: ["archive", "-e", handlerPath],
      cwd: temporaryDirectory,
    });
    expect(calls[1].file).toBe("aws");
    expect(calls[1].args).toContain(`fileb://${path.join(temporaryDirectory, "archive.zip")}`);
    expect(setupAliases).toHaveBeenCalledWith("FoodCatalog");
    expect(fs.existsSync(temporaryDirectory)).toBe(false);
  });

  test("cleans temporary files and never calls AWS when bundling fails", async () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "create-lambda-test-"));
    const handlerPath = path.resolve("src/functions/foodCatalog/index.ts");
    const execFileSync = jest.fn(() => {
      throw new Error("bundle failed");
    });
    const setupAliases = jest.fn();

    await expect(
      createLambda(
        { functionName: "FoodCatalog", handlerPath },
        {
          execFileSync,
          setupAliases,
          createTemporaryDirectory: () => temporaryDirectory,
          lambdaBuildBinary: "lambda-build",
          roleArn: "role",
          region: "region",
          timeout: 30,
        }
      )
    ).rejects.toThrow("bundle failed");

    expect(execFileSync).toHaveBeenCalledTimes(1);
    expect(setupAliases).not.toHaveBeenCalled();
    expect(fs.existsSync(temporaryDirectory)).toBe(false);
  });

  test("does not call AWS when lambda-build exits without creating an archive", async () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "create-lambda-test-"));
    const handlerPath = path.resolve("src/functions/foodCatalog/index.ts");
    const execFileSync = jest.fn();

    await expect(
      createLambda(
        { functionName: "FoodCatalog", handlerPath },
        {
          execFileSync,
          setupAliases: jest.fn(),
          createTemporaryDirectory: () => temporaryDirectory,
          lambdaBuildBinary: "lambda-build",
          roleArn: "role",
          region: "region",
          timeout: 30,
        }
      )
    ).rejects.toThrow("lambda-build did not create the expected archive.zip file");

    expect(execFileSync).toHaveBeenCalledTimes(1);
    expect(fs.existsSync(temporaryDirectory)).toBe(false);
  });

  test("cleans the archive and skips aliases when AWS creation fails", async () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "create-lambda-test-"));
    const handlerPath = path.resolve("src/functions/foodCatalog/index.ts");
    const execFileSync = jest.fn((_file: string, args: string[], options: any) => {
      if (args[0] === "archive") {
        fs.writeFileSync(path.join(options.cwd, "archive.zip"), "zip");
        return;
      }
      throw new Error("AWS creation failed");
    });
    const setupAliases = jest.fn();

    await expect(
      createLambda(
        { functionName: "FoodCatalog", handlerPath },
        {
          execFileSync,
          setupAliases,
          createTemporaryDirectory: () => temporaryDirectory,
          lambdaBuildBinary: "lambda-build",
          roleArn: "role",
          region: "region",
          timeout: 30,
        }
      )
    ).rejects.toThrow("AWS creation failed");

    expect(setupAliases).not.toHaveBeenCalled();
    expect(fs.existsSync(temporaryDirectory)).toBe(false);
  });

  test("reports alias failure without implying the Lambda creation was rolled back", async () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "create-lambda-test-"));
    const handlerPath = path.resolve("src/functions/foodCatalog/index.ts");
    const execFileSync = jest.fn((_file: string, args: string[], options: any) => {
      if (args[0] === "archive") {
        fs.writeFileSync(path.join(options.cwd, "archive.zip"), "zip");
      }
    });

    await expect(
      createLambda(
        { functionName: "FoodCatalog", handlerPath },
        {
          execFileSync,
          setupAliases: () => {
            throw new Error("alias failed");
          },
          createTemporaryDirectory: () => temporaryDirectory,
          lambdaBuildBinary: "lambda-build",
          roleArn: "role",
          region: "region",
          timeout: 30,
        }
      )
    ).rejects.toThrow("Lambda was created, but alias setup failed: alias failed");

    expect(execFileSync).toHaveBeenCalledTimes(2);
    expect(fs.existsSync(temporaryDirectory)).toBe(false);
  });
});
