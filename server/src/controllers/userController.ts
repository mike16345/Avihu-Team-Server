import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import { extractBodyFromEvent, extractQueryFromEvent } from "../utils/utils";
import SessionService from "../services/sessionService";
import { ISession } from "../models/sessionModel";
import PasswordsService from "../services/PasswordsService";
import { EmailService } from "../services/EmailService";
import { IUser } from "../interfaces/IUser";
import BaseController from "./BaseController";
import { welcomeEmailTemplate } from "../utils/emailTemplates";

export class UserController extends BaseController<IUser, UserService> {
  private sessionService: SessionService;

  constructor() {
    super(new UserService());
    this.sessionService = new SessionService();
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
        await PasswordsService.hashPassword(user._id.toString(), phoneNumber);

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
    try {
      const {
        email,
        password,
        error: bodyError,
      } = this.getParamsOrError(event, ["email", "password"], "body");

      if (bodyError) return bodyError;
      const user = await this.service.findOne({ email: email.toLowerCase() });

      const error = this.validateUserAccess(user);
      if (error) return error;

      await PasswordsService.updatePassword(user._id.toString(), password);

      return this.successResponse({
        status: StatusCode.OK,
        data: user,
        message: "סיסמה נשמרה במערכת!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  logIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const { email, password, isAdminApp, error } = this.getParamsOrError(
        event,
        ["email", "password"],
        "body"
      );
      if (error) return error;

      const user = await this.service.findOne({ email: email.toLowerCase() });
      const isSamePassword =
        user && (await PasswordsService.comparePasswords(user._id.toString(), password));

      if (!user || !isSamePassword) {
        return this.errorResponse(`מייל או סיסמא שגויים!`, StatusCode.NOT_FOUND);
      }

      if (isAdminApp && !user.isAdmin) {
        return this.errorResponse("אין הרשאה להתחבר כמנהל!", StatusCode.FORBIDDEN);
      }

      const sessionData = {
        userId: user._id.toString(),
        data: { user },
        type: "login",
      };
      const session = await this.sessionService.create(sessionData as ISession);

      return this.successResponse({
        status: StatusCode.OK,
        data: session,
        message: "התחברות בוצעה בהצלחה!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  checkUserSessionToken = async (event: APIGatewayEvent) => {
    try {
      const { token, error } = this.getParamsOrError(event, ["token"], "body");

      if (error) return error;
      const session = await this.sessionService.getSessionById(token._id);
      const userId = token.data.user._id;
      const user = await this.service.findById(userId);

      await this.sessionService.refreshSession(token._id);

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
