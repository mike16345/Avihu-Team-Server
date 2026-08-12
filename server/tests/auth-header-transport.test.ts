import { UserController } from "../src/controllers/userController";
import { extractBearerToken } from "../src/utils/utils";

describe("Bearer token transport", () => {
  test("extractBearerToken accepts Authorization header", () => {
    expect(extractBearerToken({ Authorization: "Bearer abc" })).toBe("abc");
  });

  test("extractBearerToken accepts lowercase authorization header", () => {
    expect(extractBearerToken({ authorization: "Bearer abc" })).toBe("abc");
  });

  test("missing Authorization header returns unauthorized", () => {
    expect(() => extractBearerToken({})).toThrow();
  });

  test("malformed Authorization header returns unauthorized", () => {
    expect(() => extractBearerToken({ Authorization: "Bearer" })).toThrow();
  });

  test("Authorization without Bearer returns unauthorized", () => {
    expect(() => extractBearerToken({ Authorization: "Token abc" })).toThrow();
  });

  test("/auth/me succeeds with Authorization Bearer token", async () => {
    const controller = new UserController() as any;
    controller.jwtAuthService = { verifyAccessToken: jest.fn().mockReturnValue({ userId: "u1" }) };
    controller.service = {
      findById: jest.fn().mockResolvedValue({
        _id: "u1",
        email: "a@a.com",
        role: "admin",
        hasAccess: true,
        firstName: "A",
        lastName: "B",
      }),
      getTrainerDietPlanVersion: jest.fn().mockResolvedValue(1),
    };

    const response = await controller.me({ headers: { Authorization: "Bearer valid" } });
    expect(response.statusCode).toBe(200);
  });

  test("/auth/me includes the head trainer diet-plan version", async () => {
    const controller = new UserController() as any;
    controller.jwtAuthService = { verifyAccessToken: jest.fn().mockReturnValue({ userId: "u1" }) };
    controller.service = {
      findById: jest.fn().mockResolvedValue({
        _id: "u1",
        trainerId: "trainer-1",
        email: "trainer@example.com",
        role: "trainer",
        hasAccess: true,
        firstName: "A",
        lastName: "B",
      }),
      getTrainerDietPlanVersion: jest.fn().mockResolvedValue(2),
    };

    const response = await controller.me({ headers: { Authorization: "Bearer valid" } });
    const payload = JSON.parse(response.body);

    expect(payload.data.dietPlanVersion).toBe(2);
    expect(controller.service.getTrainerDietPlanVersion).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "u1", trainerId: "trainer-1" })
    );
  });

  test("/auth/me succeeds with lowercase authorization", async () => {
    const controller = new UserController() as any;
    controller.jwtAuthService = { verifyAccessToken: jest.fn().mockReturnValue({ userId: "u1" }) };
    controller.service = {
      findById: jest.fn().mockResolvedValue({
        _id: "u1",
        email: "a@a.com",
        role: "admin",
        hasAccess: true,
        firstName: "A",
        lastName: "B",
      }),
      getTrainerDietPlanVersion: jest.fn().mockResolvedValue(1),
    };

    const response = await controller.me({ headers: { authorization: "Bearer valid" } });
    expect(response.statusCode).toBe(200);
  });

  test("/auth/me invalid token returns 401", async () => {
    const controller = new UserController() as any;
    controller.jwtAuthService = {
      verifyAccessToken: jest.fn().mockImplementation(() => {
        throw new Error("bad");
      }),
    };

    const response = await controller.me({ headers: { Authorization: "Bearer invalid" } });
    expect(response.statusCode).toBe(401);
  });

  test("/auth/me ignores token in query/body and rejects missing header", async () => {
    const controller = new UserController() as any;
    const response = await controller.me({
      headers: {},
      body: JSON.stringify({ accessToken: "x" }),
      queryStringParameters: { accessToken: "x" },
    });
    expect(response.statusCode).toBe(401);
  });
});
