import JwtAuthService from "../src/services/JwtAuthService";
import { enforceRequestUserAccess } from "../src/guards/AdminAccessGuard";
import { User as UserModel } from "../src/models/userModel";
import { StatusCode } from "../src/enums/StatusCode";
import { AUTH_ERROR_CODES } from "../src/constants/authErrorCodes";

describe("enforceRequestUserAccess", () => {
  const mockUserLookup = (user: any) =>
    jest.spyOn(UserModel, "findById").mockReturnValue({
      lean: jest.fn().mockResolvedValue(user),
    } as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads the user from a verified bearer access token and attaches it to the event", async () => {
    const user = { _id: "u1", role: "admin", hasAccess: true, isDeleted: false } as any;
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ userId: "u1", sessionId: "s1", role: "admin", exp: 9999999999 });
    mockUserLookup(user);

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
      code: AUTH_ERROR_CODES.INVALID_TOKEN,
    });
  });

  test("rejects inactive users with forbidden", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ sub: "u1", sessionId: "s1", role: "trainer", exp: 9999999999 } as any);
    mockUserLookup({
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
      code: AUTH_ERROR_CODES.ACCESS_REVOKED,
    });
  });

  test("allows subtrainers to pass subtrainer routes but not trainer routes", async () => {
    jest
      .spyOn(JwtAuthService.prototype, "verifyAccessToken")
      .mockReturnValue({ sub: "u1", sessionId: "s1", role: "subTrainer", exp: 9999999999 } as any);
    mockUserLookup({
      _id: "u1",
      role: "subTrainer",
      hasAccess: true,
      isDeleted: false,
    } as any);

    const subtrainerEvent: any = {
      headers: { authorization: "Bearer valid-token" },
    };

    await expect(enforceRequestUserAccess(subtrainerEvent, "subtrainer")).resolves.toMatchObject({
      _id: "u1",
      role: "subTrainer",
    });
    expect(subtrainerEvent.authUser).toMatchObject({ _id: "u1", role: "subTrainer" });

    await expect(
      enforceRequestUserAccess(
        { headers: { authorization: "Bearer valid-token" } } as any,
        "trainer"
      )
    ).rejects.toMatchObject({
      statusCode: StatusCode.FORBIDDEN,
    });
  });

  test("requires a bearer token when invoked for an authenticated public request", async () => {
    await expect(enforceRequestUserAccess({ headers: {} } as any, "public")).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
      code: AUTH_ERROR_CODES.INVALID_TOKEN,
    });
  });
});
