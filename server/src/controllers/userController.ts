import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import { extractBodyFromEvent, extractQueryFromEvent, getHeaderValue } from "../utils/utils";
import SessionService from "../services/sessionService";
import { ISession } from "../models/sessionModel";
import PasswordsService from "../services/PasswordsService";
import { EmailService } from "../services/EmailService";
import { IUser } from "../interfaces/IUser";
import BaseController from "./BaseController";
import { welcomeEmailTemplate } from "../utils/emailTemplates";
import AuthService from "../services/AuthService";
import JwtAuthService from "../services/JwtAuthService";

export class UserController extends BaseController<IUser, UserService> {
  private authService: AuthService;
  private sessionService: SessionService;
  private jwtAuthService: JwtAuthService;

  constructor() {
    super(new UserService());
    this.sessionService = new SessionService();
    this.authService = new AuthService();
    this.jwtAuthService = new JwtAuthService();
  }

  private validateUserAccess(user: IUser | null): APIGatewayProxyResult | null {
    if (!user) {
      return this.errorResponse(`משתמש לא נמצא!`, StatusCode.NOT_FOUND);
    }
    if (!user.hasAccess) {
      return this.errorResponse(`אין גישה לכתובת המייל`, StatusCode.UNAUTHORIZED);
    }
    return null;
  }

  addUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const userToCreate = extractBodyFromEvent(event);
      const user = await this.service.create(userToCreate);

      if (user) {
        const phoneNumber = user.phone.replace(/\D/g, "");
        await new PasswordsService().hashPassword(user._id.toString(), phoneNumber);

        const mailOptions = {
          to: user.email,
          ...welcomeEmailTemplate(phoneNumber),
        };

        await new EmailService().sendEmail(mailOptions);
      }

      return this.successResponse({
        status: StatusCode.CREATED,
        data: user,
        message: "User created successfully!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateUserField = async (event: APIGatewayEvent, context: Context) => {
    const {
      fieldName,
      value,
      error: bodyError,
    } = this.getParamsOrError(event, ["fieldName", "value"], "body");
    const { userId, error: queryError } = this.getParamsOrError(event, ["userId"]);

    if (bodyError || queryError) {
      return bodyError || queryError;
    }

    try {
      const user = await this.service.updateUserField(userId, fieldName, value);

      return this.successResponse({
        status: StatusCode.OK,
        data: user,
        message: "User updated successfully!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getById = async (event: APIGatewayProxyEvent) => {
    const { userId, error } = this.getParamsOrError(event, ["userId"]);

    if (error) return error;

    try {
      const user = await this.service.findById(userId);

      return this.successResponse({
        status: StatusCode.OK,
        data: user,
        message: "User retrieved successfully!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  checkUsersAccess = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { email } = extractQueryFromEvent(event);

    try {
      const user = await this.service.findOne({ email: email?.toLowerCase() });
      const error = this.validateUserAccess(user);
      if (error) return error;

      return this.successResponse({
        status: StatusCode.OK,
        data: user,
        message: "פעולה בוצעה בהצלחה!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const {
      email,
      password,
      error: bodyError,
    } = this.getParamsOrError(event, ["email", "password"], "body");

    if (bodyError) return bodyError;

    try {
      const user = await this.authService.register(email, password);

      return this.successResponse({
        status: StatusCode.OK,
        data: user,
        message: "סיסמה נשמרה במערכת!",
      });
    } catch (err: any) {
      return this.errorResponse(err.message, err.statusCode || StatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  logIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { email, password, isAdminApp, error } = this.getParamsOrError(
      event,
      ["email", "password"],
      "body"
    );

    if (error) return error;

    try {
      const ip = event.requestContext?.identity?.sourceIp;
      const headers = event.headers || {};
      const device = getHeaderValue(headers, "User-Agent");

      const session = await this.authService.login(email, password, isAdminApp, {
        ip,
        device,
      });
      const user = session.data?.user;
      const { refreshToken } = await this.jwtAuthService.createRefreshSession(user, { ip, device });
      const accessToken = this.jwtAuthService.signAccessToken({
        userId: user._id.toString(),
        role: user.role,
        sessionId: session._id?.toString(),
      });

      return this.successResponse({
        status: StatusCode.OK,
        data: { accessToken, refreshToken, sessionId: session._id, user: this.toSafeUser(user) },
        message: "התחברות בוצעה בהצלחה!",
      });
    } catch (err: any) {
      return this.errorResponse(err.message, err.statusCode || StatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  refreshAuth = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { refreshToken, error } = this.getParamsOrError(event, ["refreshToken"], "body");
    if (error) return error;

    try {
      const { user } = await this.jwtAuthService.validateRefreshToken(refreshToken);
      const accessToken = this.jwtAuthService.signAccessToken({
        userId: user._id.toString(),
        role: user.role,
      });
      return this.successResponse({
        status: StatusCode.OK,
        data: { accessToken, user: this.toSafeUser(user) },
      });
    } catch (err: any) {
      return this.errorResponse(err.message, err.statusCode || StatusCode.UNAUTHORIZED);
    }
  };

  logoutAuth = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { refreshToken, error } = this.getParamsOrError(event, ["refreshToken"], "body");
    if (error) return error;

    try {
      await this.jwtAuthService.revokeRefreshToken(refreshToken);
      return this.successResponse({ status: StatusCode.OK, message: "Logged out" });
    } catch (err: any) {
      return this.errorResponse(err.message, err.statusCode || StatusCode.UNAUTHORIZED);
    }
  };

  me = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const authHeader = getHeaderValue(event.headers || {}, "Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return this.errorResponse("Missing token", StatusCode.UNAUTHORIZED);

    try {
      const claims = this.jwtAuthService.verifyAccessToken(authHeader.slice(7));
      const user = await this.service.findById(claims.userId);
      if (!user) return this.errorResponse("Unauthorized", StatusCode.UNAUTHORIZED);
      if (!user.hasAccess) return this.errorResponse("Unauthorized", StatusCode.FORBIDDEN);
      return this.successResponse({ status: StatusCode.OK, data: this.toSafeUser(user) });
    } catch (err) {
      return this.errorResponse("Unauthorized", StatusCode.UNAUTHORIZED);
    }
  };

  private toSafeUser(user: IUser) {
    return {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.hasAccess ? "active" : "inactive",
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: user.role === "admin",
      isTrainer: user.role === "trainer",
    };
  }

  checkUserSessionToken = async (event: APIGatewayEvent) => {
    try {
      const { token, error } = this.getParamsOrError(event, ["token"], "body");

      if (error) return error;
      const session = await this.sessionService.getSessionById(token._id);
      const userId = token.data.user._id;
      const user = await this.service.findById(userId);

      if (session) {
        await this.sessionService.refreshSession(token._id);
      }

      if (!user) {
        return this.errorResponse("User not found!", StatusCode.NOT_FOUND);
      }

      if (!user.hasAccess) {
        await this.sessionService.deleteById(token._id);
      }

      return this.successResponse({
        status: StatusCode.OK,
        data: {
          isValid: !!session,
          hasAccess: user.hasAccess,
        },
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
