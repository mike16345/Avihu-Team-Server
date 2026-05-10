jest.mock("../src/db/connect", () => jest.fn().mockResolvedValue(undefined));
jest.mock("../src/guards/AdminAccessGuard", () => ({
  enforceRequestUserAccess: jest.fn().mockResolvedValue({ _id: "u1" }),
}));

import connectToDB from "../src/db/connect";
import { enforceRequestUserAccess } from "../src/guards/AdminAccessGuard";
import { handleApiCall } from "../src/functions/baseHandler";
import JwtAuthService from "../src/services/JwtAuthService";
import { getAuthContext } from "../src/utils/authContext";

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

    (enforceRequestUserAccess as jest.Mock).mockImplementation(async (event: any) => {
      executionOrder.push("auth");
      event.authUser = { _id: "u1", trainerId: "t1", role: "trainer" };
      return event.authUser;
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

  test("exposes request-local auth context to protected handlers without mutating request input", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);

    (enforceRequestUserAccess as jest.Mock).mockImplementation(async (event: any) => {
      event.authUser = { _id: "u1", trainerId: "t1", role: "trainer" };
      return event.authUser;
    });

    const body = JSON.stringify({ trainerId: "body-trainer" });
    const event: any = {
      httpMethod: "POST",
      path: "/protected",
      headers: { Authorization: "Bearer secret-token" },
      body,
      queryStringParameters: { trainerId: "query-trainer" },
      requestContext: { requestId: "req-ctx" },
    };

    const response = await handleApiCall(event, {} as any, {
      "POST /protected": {
        access: "authenticated",
        handler: async () => ({
          statusCode: 200,
          body: JSON.stringify({ authContext: getAuthContext() }),
        }),
      },
    });

    expect(JSON.parse(response.body)).toEqual({
      authContext: { userId: "u1", trainerId: "t1", role: "trainer" },
    });
    expect(event.body).toBe(body);
    expect(event.queryStringParameters).toEqual({ trainerId: "query-trainer" });
  });

  test("exposes token claims in auth context for public routes with bearer auth", async () => {
    jest.spyOn(JwtAuthService.prototype, "verifyAccessToken").mockReturnValue({
      userId: "u2",
      trainerId: "t2",
      sessionId: "s2",
      role: "trainer",
      exp: 9999999999,
    } as any);

    const response = await handleApiCall(
      {
        httpMethod: "GET",
        path: "/public",
        headers: { Authorization: "Bearer public-token" },
        requestContext: { requestId: "req-3" },
      } as any,
      {} as any,
      {
        "GET /public": {
          access: "public",
          handler: async () => ({
            statusCode: 200,
            body: JSON.stringify({ authContext: getAuthContext() }),
          }),
        },
      }
    );

    expect(JSON.parse(response.body)).toEqual({
      authContext: { userId: "u2", trainerId: "t2", role: "trainer" },
    });
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
