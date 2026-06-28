import { type APIGatewayEvent } from "aws-lambda";
import PasswordsService from "../services/PasswordsService";
import UserService from "../services/userService";
import SessionService from "../services/sessionService";
import { createResponse, createServerErrorResponse, isSessionExpired } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import { ONE_MINUTE_IN_MILLISECONDS } from "../constants/Constants";
import { IPassword } from "../models/passwordModel";
import BaseController from "./BaseController";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes";

class PasswordsController extends BaseController<IPassword, PasswordsService> {
  private userService: UserService;
  private sessionService: SessionService;

  constructor() {
    super(new PasswordsService());
    this.userService = new UserService();
    this.sessionService = new SessionService();
  }

  hashPassword = async (event: APIGatewayEvent) => {
    try {
      const { email, password, error } = this.getParamsOrError(
        event,
        ["email", "password"],
        "body"
      );

      if (error) return error;

      const user = await this.userService.findOne({ email: email.toLowerCase() });

      if (!user) {
        return this.errorResponse("משתמש לא נמצא במערכת!", StatusCode.NOT_FOUND);
      }

      await this.service.hashPassword(user._id.toString(), password);

      return this.successResponse({
        status: StatusCode.OK,
        message: "Encrypted password!",
      });
    } catch (error: any) {
      return this.errorResponse(error);
    }
  };

  updatePassword = async (event: APIGatewayEvent) => {
    const { email, password, sessionId, error } = this.getParamsOrError(
      event,
      ["email", "password", "sessionId"],
      "body"
    );

    if (error) return error;

    const session = await this.sessionService.getSessionById(sessionId);

    if (!session) {
      return this.errorResponse(
        "נא לבקש קוד חדש",
        StatusCode.UNAUTHORIZED,
        AUTH_ERROR_CODES.MISSING_OTP
      );
    }

    if (isSessionExpired(session, ONE_MINUTE_IN_MILLISECONDS * 10)) {
      return this.errorResponse(
        "קוד לא פעיל!",
        StatusCode.UNAUTHORIZED,
        AUTH_ERROR_CODES.OTP_EXPIRED
      );
    }

    try {
      const user = await this.userService.findOneUnscoped({ email: email.toLowerCase() });

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `משתמש לא נמצא במערכת! ${email}`);
      }

      await this.service.updatePassword(user._id.toString(), password);
      await this.sessionService.deleteById(sessionId);

      return createResponse(StatusCode.OK, "סיסמא הוחלפה בהצלחה!");
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  };

  comparePasswords = async (event: APIGatewayEvent) => {
    const { email, password, error } = this.getParamsOrError(event, ["email", "password"], "body");

    if (error) return error;

    try {
      const match = await this.service.comparePasswords(email, password);

      if (!match) {
        return this.errorResponse(
          { message: "סיסמאות אינן תואמות!", code: AUTH_ERROR_CODES.INVALID_CREDENTIALS },
          StatusCode.UNAUTHORIZED
        );
      }

      return this.successResponse({
        status: StatusCode.OK,
        data: match,
        message: "סיסמאות תואמות!",
      });
    } catch (error: any) {
      return this.errorResponse(error);
    }
  };
}

export default PasswordsController;
