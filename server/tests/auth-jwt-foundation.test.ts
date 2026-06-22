import JwtAuthService from "../src/services/JwtAuthService";
import jwt from "jsonwebtoken";
import { StatusCode } from "../src/enums/StatusCode";
import { AUTH_ERROR_CODES } from "../src/constants/authErrorCodes";

describe("JwtAuthService", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "12345678901234567890123456789012";
    process.env.JWT_ACCESS_EXPIRES_IN = "1";
  });

  test("valid access token", () => {
    const service = new JwtAuthService();
    const token = service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" });
    const claims = service.verifyAccessToken(token);
    expect(claims.userId).toBe("u1");
    expect(claims.sessionId).toBe("s1");
    expect(typeof claims.exp).toBe("number");
    expect(typeof claims.iat).toBe("number");
  });

  test("malformed token", () => {
    const service = new JwtAuthService();
    expect(() => service.verifyAccessToken("bad")).toThrow(
      expect.objectContaining({
        message: "Unauthorized",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_TOKEN,
      })
    );
  });

  test("invalid signature", () => {
    process.env.JWT_ACCESS_SECRET = "abcdefghijklmnopqrstuvwxyz123456";
    const service = new JwtAuthService();
    const token = jwt.sign(
      { userId: "u1", role: "admin", sessionId: "s1" },
      "abcdefghijklmnopqrstuvwxyz654321",
      { algorithm: "HS256", expiresIn: 60 }
    );

    expect(() => service.verifyAccessToken(token)).toThrow(
      expect.objectContaining({
        message: "Unauthorized",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_TOKEN,
      })
    );
  });

  test("expired token within grace period is accepted", () => {
    const service = new JwtAuthService();
    const token = jwt.sign(
      {
        userId: "u1",
        role: "admin",
        sessionId: "s1",
        exp: Math.floor(Date.now() / 1000) - 1,
      },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: "HS256" }
    );

    const claims = service.verifyAccessToken(token);
    expect(claims.userId).toBe("u1");
    expect(claims.sessionId).toBe("s1");
  });

  test("numeric expiration strings still behave as seconds", () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "900";
    const service = new JwtAuthService();
    const token = service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" });
    const claims = service.verifyAccessToken(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);

    expect((claims.exp ?? 0) - nowInSeconds).toBeGreaterThan(890);
    expect((claims.exp ?? 0) - nowInSeconds).toBeLessThanOrEqual(900);
  });

  test("string expiration values like 7d are supported", () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "7d";
    const service = new JwtAuthService();
    const token = service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" });
    const claims = service.verifyAccessToken(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);

    expect((claims.exp ?? 0) - nowInSeconds).toBeGreaterThan(60 * 60 * 24 * 6);
    expect((claims.exp ?? 0) - nowInSeconds).toBeLessThanOrEqual(60 * 60 * 24 * 7);
  });

  test("shouldRenewAccessToken returns true only within the configured threshold", () => {
    process.env.REFRESH_RENEWAL_THRESHOLD_DAYS = "2";
    const service = new JwtAuthService();

    expect(service.shouldRenewAccessToken(new Date(Date.now() + 1000 * 60 * 60 * 24))).toBe(true);
    expect(service.shouldRenewAccessToken(new Date(Date.now() + 1000 * 60 * 60 * 24 * 3))).toBe(
      false
    );
    expect(service.shouldRenewAccessToken(new Date(Date.now() - 1000))).toBe(false);
  });

  test("invalid expiration config", () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "abc";
    const service = new JwtAuthService();
    expect(() =>
      service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" })
    ).toThrow();
  });

  test("empty expiration config is rejected", () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "   ";
    const service = new JwtAuthService();
    expect(() =>
      service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" })
    ).toThrow();
  });

  test("expired token beyond grace period is rejected", () => {
    const service = new JwtAuthService();
    const token = jwt.sign(
      {
        userId: "u1",
        role: "admin",
        sessionId: "s1",
        exp: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 31,
      },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: "HS256" }
    );

    expect(() => service.verifyAccessToken(token)).toThrow(
      expect.objectContaining({
        message: "Unauthorized",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.TOKEN_EXPIRED,
      })
    );
  });

  test("missing JWT secret", () => {
    delete process.env.JWT_ACCESS_SECRET;
    const service = new JwtAuthService();
    expect(() =>
      service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" })
    ).toThrow();
  });

  test("missing sessionId in signing claims", () => {
    const service = new JwtAuthService();

    expect(() => service.signAccessToken({ userId: "u1", role: "admin", sessionId: "" })).toThrow(
      expect.objectContaining({
        message: "Missing sessionId in claims",
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      })
    );
  });

  test("rejects token missing sessionId", () => {
    const service = new JwtAuthService();
    const token = jwt.sign({ userId: "u1", role: "admin" }, process.env.JWT_ACCESS_SECRET!, {
      algorithm: "HS256",
      expiresIn: 60,
    });

    expect(() => service.verifyAccessToken(token)).toThrow(
      expect.objectContaining({
        message: "Unauthorized",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_TOKEN,
      })
    );
  });

  test("rejects token missing identity fields", () => {
    const service = new JwtAuthService();
    const token = jwt.sign({ role: "admin", sessionId: "s1" }, process.env.JWT_ACCESS_SECRET!, {
      algorithm: "HS256",
      expiresIn: 60,
    });

    expect(() => service.verifyAccessToken(token)).toThrow(
      expect.objectContaining({
        message: "Unauthorized",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_TOKEN,
      })
    );
  });

  test("rejects token with non-access type", () => {
    const service = new JwtAuthService();
    const token = jwt.sign(
      { userId: "u1", role: "admin", sessionId: "s1", type: "refresh" },
      process.env.JWT_ACCESS_SECRET!,
      {
        algorithm: "HS256",
        expiresIn: 60,
      }
    );

    expect(() => service.verifyAccessToken(token)).toThrow(
      expect.objectContaining({
        message: "Unauthorized",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_TOKEN,
      })
    );
  });

  test("refresh token hashing stays SHA256-based and deterministic", () => {
    const service = new JwtAuthService();
    const hashA = service.hashToken("refresh-token");
    const hashB = service.hashToken("refresh-token");

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
    expect(hashA).toMatch(/^[a-f0-9]+$/);
  });

  test("refresh token not found", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = { findRefreshSessionByHash: jest.fn().mockResolvedValue(null) };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
      code: AUTH_ERROR_CODES.SESSION_EXPIRED,
    });
  });

  test("revoked refresh token", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = {
      findRefreshSessionByHash: jest.fn().mockResolvedValue({
        userId: "u1",
        data: { revokedAt: new Date(), expiresAt: new Date(Date.now() + 10000) },
      }),
    };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
      code: AUTH_ERROR_CODES.SESSION_REVOKED,
    });
  });

  test("expired refresh token", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = {
      findRefreshSessionByHash: jest.fn().mockResolvedValue({
        userId: "u1",
        data: { revokedAt: null, expiresAt: new Date(Date.now() - 1000) },
      }),
    };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
      code: AUTH_ERROR_CODES.SESSION_EXPIRED,
    });
  });

  test("inactive user", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = {
      findRefreshSessionByHash: jest.fn().mockResolvedValue({
        userId: "u1",
        data: { revokedAt: null, expiresAt: new Date(Date.now() + 1000) },
      }),
    };
    service.userRepository = { findById: jest.fn().mockResolvedValue({ hasAccess: false }) };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
      code: AUTH_ERROR_CODES.ACCESS_REVOKED,
    });
  });

  test("successful refresh session validation", async () => {
    const service = new JwtAuthService() as any;
    const user = { _id: "u1", hasAccess: true };
    const session = {
      _id: "s1",
      userId: "u1",
      data: { revokedAt: null, expiresAt: new Date(Date.now() + 1000) },
    };
    service.sessionRepository = { findRefreshSessionByHash: jest.fn().mockResolvedValue(session) };
    service.userRepository = { findById: jest.fn().mockResolvedValue(user) };
    await expect(service.validateRefreshToken("x")).resolves.toMatchObject({ session, user });
  });

  afterEach(() => {
    delete process.env.REFRESH_RENEWAL_THRESHOLD_DAYS;
  });
});
