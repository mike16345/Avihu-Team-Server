import JwtAuthService from "../src/services/JwtAuthService";
import { StatusCode } from "../src/enums/StatusCode";

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
  });

  test("malformed token", () => {
    const service = new JwtAuthService();
    expect(() => service.verifyAccessToken("bad")).toThrow();
  });

  test("invalid signature", () => {
    const service = new JwtAuthService();
    const token = service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" });
    expect(() => service.verifyAccessToken(token + "tamper")).toThrow();
  });

  test("expired token", async () => {
    const service = new JwtAuthService();
    const token = service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" });
    await new Promise((r) => setTimeout(r, 1200));
    expect(() => service.verifyAccessToken(token)).toThrow();
  });

  test("invalid expiration config", () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "abc";
    const service = new JwtAuthService();
    expect(() =>
      service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" })
    ).toThrow();
  });

  test("missing JWT secret", () => {
    delete process.env.JWT_ACCESS_SECRET;
    const service = new JwtAuthService();
    expect(() =>
      service.signAccessToken({ userId: "u1", role: "admin", sessionId: "s1" })
    ).toThrow();
  });

  test("refresh token not found", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = { findRefreshSessionByHash: jest.fn().mockResolvedValue(null) };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
    });
  });

  test("revoked refresh token", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = {
      findRefreshSessionByHash: jest
        .fn()
        .mockResolvedValue({
          userId: "u1",
          data: { revokedAt: new Date(), expiresAt: new Date(Date.now() + 10000) },
        }),
    };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
    });
  });

  test("expired refresh token", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = {
      findRefreshSessionByHash: jest
        .fn()
        .mockResolvedValue({
          userId: "u1",
          data: { revokedAt: null, expiresAt: new Date(Date.now() - 1000) },
        }),
    };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
    });
  });

  test("inactive user", async () => {
    const service = new JwtAuthService() as any;
    service.sessionRepository = {
      findRefreshSessionByHash: jest
        .fn()
        .mockResolvedValue({
          userId: "u1",
          data: { revokedAt: null, expiresAt: new Date(Date.now() + 1000) },
        }),
    };
    service.userRepository = { findById: jest.fn().mockResolvedValue({ hasAccess: false }) };
    await expect(service.validateRefreshToken("x")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
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
});
