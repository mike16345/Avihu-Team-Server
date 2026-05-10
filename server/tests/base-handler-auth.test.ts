jest.mock("../src/db/connect", () => jest.fn().mockResolvedValue(undefined));
jest.mock("../src/guards/AdminAccessGuard", () => ({
  enforceRequestUserAccess: jest.fn().mockResolvedValue({ _id: "u1" }),
}));

import connectToDB from "../src/db/connect";
import { enforceRequestUserAccess } from "../src/guards/AdminAccessGuard";
import { handleApiCall } from "../src/functions/baseHandler";

describe("handleApiCall auth flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("enforces auth on protected routes before middleware, validators, and handler", async () => {
    const executionOrder: string[] = [];
    const middleware = jest.fn().mockImplementation(async () => {
      executionOrder.push("middleware");
      return { isValid: true };
    });
    const validator = jest.fn().mockImplementation(async () => {
      executionOrder.push("validator");
      return { isValid: true };
    });
    const handler = jest.fn().mockImplementation(async () => {
      executionOrder.push("handler");
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    });

    (enforceRequestUserAccess as jest.Mock).mockImplementation(async () => {
      executionOrder.push("auth");
      return { _id: "u1" };
    });

    const event: any = {
      httpMethod: "GET",
      path: "/protected",
      headers: { Authorization: "Bearer secret-token" },
      requestContext: { requestId: "req-1" },
    };
    const context: any = {};

    const response = await handleApiCall(
      event,
      context,
      {
        "GET /protected": {
          access: "authenticated",
          middlewares: [middleware],
          handler,
        },
      },
      {
        "GET /protected": validator,
      }
    );

    expect(response.statusCode).toBe(200);
    expect(connectToDB).toHaveBeenCalled();
    expect(enforceRequestUserAccess).toHaveBeenCalledWith(event, "authenticated");
    expect(executionOrder).toEqual(["auth", "middleware", "validator", "handler"]);
  });

  test("logs request metadata without leaking the authorization header value", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await handleApiCall(
      {
        httpMethod: "GET",
        path: "/protected",
        headers: { Authorization: "Bearer secret-token" },
        requestContext: { requestId: "req-2" },
      } as any,
      {} as any,
      {
        "GET /protected": {
          access: "authenticated",
          handler: async () => ({ statusCode: 200, body: "{}" }),
        },
      }
    );

    const logOutput = logSpy.mock.calls.flat().map(String).join(" ");
    const requestLogCall = logSpy.mock.calls.find(
      ([message]) => message === "Handling API request"
    );
    expect(logOutput).not.toContain("secret-token");
    expect(requestLogCall?.[1]).toMatchObject({ hasAuthorizationHeader: true });
  });
});
