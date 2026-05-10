import JwtAuthService from "../src/services/JwtAuthService";
import { enforceRequestUserAccess } from "../src/guards/AdminAccessGuard";
import { User as UserModel } from "../src/models/userModel";
import { StatusCode } from "../src/enums/StatusCode";

describe("enforceRequestUserAccess", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads the user from a verified bearer access token and attaches it to the event", async () => {
    const user = { _id: "u1", role: "admin", hasAccess: true, isDeleted: false } as any;
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "admin", exp: 9999999999 });
    jest.spyOn(UserModel, "findById").mockResolvedValue(user);

    const event: any = {
      headers: { Authorization: "Bearer valid-token" },
      body: JSON.stringify({ userId: "body-user" }),
      queryStringParameters: { trainerId: "query-trainer" },
    };

    const result = await enforceRequestUserAccess(event, "admin");

    expect(result).toBe(user);
    expect(event.authUser).toBe(user);
    expect(UserModel.findById).toHaveBeenCalledWith("u1");
  });

  test("rejects requests that try to authenticate through body or query without a bearer header", async () => {
    const event: any = {
      headers: {},
      body: JSON.stringify({ userId: "body-user", trainerId: "body-trainer" }),
      queryStringParameters: { userId: "query-user", trainerId: "query-trainer" },
    };

    await expect(enforceRequestUserAccess(event, "authenticated")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
    });
  });

  test("rejects inactive users with forbidden", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ sub: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);
    jest.spyOn(UserModel, "findById").mockResolvedValue({
      _id: "u1",
      role: "trainer",
      hasAccess: false,
      isDeleted: false,
    } as any);

    await expect(
      enforceRequestUserAccess(
        { headers: { authorization: "Bearer valid-token" } } as any,
        "authenticated"
      )
    ).rejects.toMatchObject({
      statusCode: StatusCode.FORBIDDEN,
    });
  });
});
