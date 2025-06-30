import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import {
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
} from "../utils/utils";
import SessionService from "../services/sessionService";
import { ISession } from "../models/sessionModel";
import PasswordsService from "../services/PasswordsService";
import { EmailService } from "../services/EmailService";
import { IUser } from "../interfaces/IUser";
import BaseController from "./BaseController";

export class UserController extends BaseController<IUser, UserService> {
  constructor() {
    super(new UserService());
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
          subject: "ברוכים הבאים ל-AvihuTeam!",
          text: `ברוכים הבאים ל-AvihuTeam!\n\nהסיסמה שלך היא: ${phoneNumber}\n\nבהצלחה!`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2c3e50;">ברוכים הבאים ל-AvihuTeam!</h2>
              <p style="font-size: 16px; color: #333;">
                אנו שמחים שהצטרפת אלינו. להלן הסיסמה שלך:
              </p>
              <p style="font-size: 18px; color: #000; font-weight: bold; background-color: #e8f0fe; padding: 10px; border-radius: 5px; display: inline-block;">
                ${phoneNumber}
              </p>
              <p style="font-size: 16px; color: #333; margin-top: 20px;">
                בהצלחה!
                <br/>
                צוות AvihuTeam
              </p>
            </div>
          `,
        };

        await new EmailService().sendEmail(mailOptions);
      }

      return createResponseWithData(StatusCode.CREATED, user, "User created successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
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

      return createResponseWithData(StatusCode.OK, user, "User updated successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  updateImagesUploadedstatus = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      const { error, id, status } = this.getParamsOrError(event, ["id", "status"]);

      if (error) return error;
      const user = await this.service.updateImagesUploadedstatus(id || "", status);

      return this.successResponse({
        status: StatusCode.OK,
        data: user,
        message: "Status updated successfully!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  checkUsersAccess = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const email = event.queryStringParameters?.email;

    try {
      const user = await this.service.findOne({ email: email?.toLowerCase() });

      if (!user) {
        return this.errorResponse(`משתמש לא נמצא!`, StatusCode.NOT_FOUND);
      }

      if (!user.hasAccess) {
        return this.errorResponse(`אין גישה לכתובת המייל`, StatusCode.UNAUTHORIZED);
      }

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
      const { email, password } = extractBodyFromEvent(event);
      const user = await this.service.findOne({ email: email.toLowerCase() });

      if (!user) {
        return this.errorResponse(`משתמש לא נמצא!`, StatusCode.NOT_FOUND);
      }

      if (!user.hasAccess) {
        return this.errorResponse(`אין גישה לכתובת המייל`, StatusCode.UNAUTHORIZED);
      }

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
      const { email, password, isAdminApp } = this.getParamsOrError(event, [
        "email",
        "password",
        "isAdminApp",
      ]);
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
      const session = await new SessionService().create(sessionData as ISession);

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
    const sessionService = new SessionService();
    try {
      const { token } = extractBodyFromEvent(event);
      const session = await sessionService.getSessionById(token._id);
      const userId = token.data.user._id;
      const user = await this.service.findById(userId);

      await sessionService.refreshSession(token._id);
      if (!user.hasAccess) {
        await sessionService.deleteById(token._id);
      }

      return createResponseWithData(StatusCode.OK, {
        isValid: !!session,
        hasAccess: user.hasAccess,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
