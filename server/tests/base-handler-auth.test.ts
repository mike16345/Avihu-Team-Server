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
  beforeEach(() => {
    jest.spyOn(JwtAuthService.prototype, "getRenewedAccessToken").mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("enforces auth on protected routes before middleware, validators, and handler", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);

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

  test("stops the request when a route middleware rejects the body", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);
    (enforceRequestUserAccess as jest.Mock).mockResolvedValue({
      _id: "u1",
      trainerId: "t1",
      role: "trainer",
    });
    const handler = jest.fn().mockResolvedValue({ statusCode: 200, body: "{}" });

    const response = await handleApiCall(
      {
        httpMethod: "POST",
        path: "/protected",
        headers: { Authorization: "Bearer secret-token" },
        requestContext: { requestId: "req-invalid-middleware" },
      } as any,
      {} as any,
      {
        "POST /protected": {
          access: "authenticated",
          middlewares: [async () => ({ isValid: false, message: "invalid diet plan" })],
          handler,
        },
      }
    );

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe("invalid diet plan");
    expect(handler).not.toHaveBeenCalled();
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
    (enforceRequestUserAccess as jest.Mock).mockImplementation(async (event: any) => {
      event.authUser = { _id: "u2", trainerId: "t2", role: "trainer" };
      return event.authUser;
    });

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
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await handleApiCall(
      {
        httpMethod: "GET",
        path: "/protected",
        headers: { Authorization: "Bearer secret-token" },
        body: JSON.stringify({ password: "body-password", title: "safe-title" }),
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
    const requestLogCalls = logSpy.mock.calls.filter(
      ([message]) => typeof message === "string" && message.startsWith("Handling API request")
    );
    const requestLogOutput = requestLogCalls.flat().join("");
    expect(logOutput).not.toContain("secret-token");
    expect(requestLogOutput).not.toContain("secret-token");
    expect(requestLogOutput).not.toContain("body-password");
    expect(requestLogOutput).toContain("safe-title");
    expect(requestLogOutput).toContain('"hasAuthorizationHeader":true');
  });

  test("logs large API responses as complete string chunks", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const responseBody = JSON.stringify({ data: `${"x".repeat(120_000)}END-OF-RESPONSE` });

    await handleApiCall(
      {
        httpMethod: "GET",
        path: "/large-response",
        headers: {},
        requestContext: { requestId: "req-large-response" },
      } as any,
      {} as any,
      {
        "GET /large-response": {
          access: "public",
          handler: async () => ({ statusCode: 200, body: responseBody }),
        },
      }
    );

    const responseLogCalls = logSpy.mock.calls.filter(
      ([message]) => typeof message === "string" && message.startsWith("API response")
    );
    const combinedLogs = responseLogCalls.flat().join("");

    expect(responseLogCalls.length).toBeGreaterThan(1);
    expect(responseLogCalls.every((call) => call.length === 1 && typeof call[0] === "string")).toBe(
      true
    );
    expect(combinedLogs).toContain("END-OF-RESPONSE");
    expect(combinedLogs).not.toContain("more characters");
  });

  test("redacts credential-bearing key variants from request and response logs", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await handleApiCall(
      {
        httpMethod: "POST",
        path: "/credential-log",
        headers: {
          "x-api-key": "request-api-key",
          "Proxy-Authorization": "proxy-authorization-credential",
        },
        body: JSON.stringify({
          passwordHash: "request-password-hash",
          nested: {
            clientSecret: "request-client-secret",
            accessKeyId: "request-access-key-id",
            safe: "visible-request-value",
          },
        }),
        requestContext: { requestId: "req-credential-log" },
      } as any,
      {} as any,
      {
        "POST /credential-log": {
          access: "public",
          handler: async () => ({
            statusCode: 200,
            body: JSON.stringify({
              changePasswordSessionId: "password-change-credential",
              tokenHash: "response-token-hash",
              resetToken: "response-reset-token",
              safe: "visible-response-value",
            }),
          }),
        },
      }
    );

    const output = logSpy.mock.calls.flat().map(String).join(" ");
    expect(output).not.toContain("request-api-key");
    expect(output).not.toContain("proxy-authorization-credential");
    expect(output).not.toContain("request-password-hash");
    expect(output).not.toContain("request-client-secret");
    expect(output).not.toContain("request-access-key-id");
    expect(output).not.toContain("password-change-credential");
    expect(output).not.toContain("response-token-hash");
    expect(output).not.toContain("response-reset-token");
    expect(output).toContain("visible-request-value");
    expect(output).toContain("visible-response-value");
  });

  test("fails closed when a request body is too deeply nested to redact safely", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const secret = "deeply-nested-password";
    const depth = 10_000;
    const body = `${'{"nested":'.repeat(depth)}{"password":"${secret}"}${"}".repeat(depth)}`;

    await handleApiCall(
      {
        httpMethod: "POST",
        path: "/deep-log",
        headers: {},
        body,
        requestContext: { requestId: "req-deep-log" },
      } as any,
      {} as any,
      {
        "POST /deep-log": {
          access: "public",
          handler: async () => ({ statusCode: 200, body: "{}" }),
        },
      }
    );

    const requestOutput = logSpy.mock.calls
      .filter(([message]) =>
        typeof message === "string" ? message.startsWith("Handling API request") : false
      )
      .flat()
      .join("");
    expect(requestOutput).not.toContain(secret);
    expect(requestOutput).toContain("[MAX LOG DEPTH]");
  });

  test("adds x-new-access-token to successful authenticated responses when renewal is needed", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);
    jest
      .spyOn(JwtAuthService.prototype, "getRenewedAccessToken")
      .mockResolvedValue("renewed-access-token");

    const response = await handleApiCall(
      {
        httpMethod: "GET",
        path: "/protected",
        headers: { Authorization: "Bearer renew-me" },
        requestContext: { requestId: "req-renew" },
      } as any,
      {} as any,
      {
        "GET /protected": {
          access: "authenticated",
          handler: async () => ({ statusCode: 200, body: "{}" }),
        },
      }
    );

    expect(response.headers?.["x-new-access-token"]).toBe("renewed-access-token");
  });

  test("does not add x-new-access-token to failed responses", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);
    const renewSpy = jest
      .spyOn(JwtAuthService.prototype, "getRenewedAccessToken")
      .mockResolvedValue("renewed-access-token");

    const response = await handleApiCall(
      {
        httpMethod: "GET",
        path: "/protected",
        headers: { Authorization: "Bearer renew-me" },
        requestContext: { requestId: "req-no-renew" },
      } as any,
      {} as any,
      {
        "GET /protected": {
          access: "authenticated",
          handler: async () => ({ statusCode: 400, body: "{}" }),
        },
      }
    );

    expect(response.headers?.["x-new-access-token"]).toBeUndefined();
    expect(renewSpy).not.toHaveBeenCalled();
  });
});
