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
import { leadEmailTemplate, welcomeEmailTemplate } from "../utils/emailTemplates";
import AuthService from "../services/AuthService";

export class UserController extends BaseController<IUser, UserService> {
  private authService: AuthService;
  private sessionService: SessionService;

  constructor() {
    super(new UserService());
    this.sessionService = new SessionService();
    this.authService = new AuthService();
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

      return this.successResponse({
        status: StatusCode.OK,
        data: session,
        message: "התחברות בוצעה בהצלחה!",
      });
    } catch (err: any) {
      return this.errorResponse(err.message, err.statusCode || StatusCode.INTERNAL_SERVER_ERROR);
    }
  };

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

  saveLead = async (event: APIGatewayEvent) => {
    try {
      const { email, phone, name, error } = this.getParamsOrError(
        event,
        ["email", "name", "phone"],
        "body"
      );

      if (error) return error;

      const mailOptions = {
        to: "noammz101@gmail.com",
        ...leadEmailTemplate(name, phone, email),
      };

      await new EmailService().sendEmail(mailOptions);

      return this.successResponse({
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
