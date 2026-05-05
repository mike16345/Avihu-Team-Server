import JwtAuthService from "../src/services/JwtAuthService";

describe("JwtAuthService", () => {
  const service = new JwtAuthService();
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.JWT_ACCESS_EXPIRES_IN = "1";
  });

  test("signs and verifies token", () => {
    const token = service.signAccessToken({ userId: "u1", role: "admin" });
    const claims = service.verifyAccessToken(token);
    expect(claims.userId).toBe("u1");
    expect(claims.role).toBe("admin");
  });

  test("rejects malformed token", () => {
    expect(() => service.verifyAccessToken("bad")).toThrow();
  });

  test("rejects expired token", async () => {
    const token = service.signAccessToken({ userId: "u1", role: "admin" });
    await new Promise((r) => setTimeout(r, 1200));
    expect(() => service.verifyAccessToken(token)).toThrow();
  });

  test("hashes refresh tokens deterministically", () => {
    expect(service.hashToken("abc")).toBe(service.hashToken("abc"));
    expect(service.hashToken("abc")).not.toBe(service.hashToken("abd"));
  });
});
