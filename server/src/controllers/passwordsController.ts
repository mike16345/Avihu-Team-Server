import { type APIGatewayEvent } from "aws-lambda";
import PasswordsService from "../services/PasswordsService";
import UserService from "../services/userService";
import SessionService from "../services/sessionService";
import { createResponse, createServerErrorResponse, isSessionExpired } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import { ONE_MINUTE_IN_MILLISECONDS } from "../constants/Constants";
import { IPassword } from "../models/passwordModel";
import BaseController from "./BaseController";

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
        return this.errorResponse("User not found", StatusCode.NOT_FOUND);
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
      return this.errorResponse("Session not found!", StatusCode.UNAUTHORIZED);
    }

    if (isSessionExpired(session, ONE_MINUTE_IN_MILLISECONDS * 10)) {
      return this.errorResponse("OTP is expired", StatusCode.UNAUTHORIZED);
    }

    try {
      const user = await this.userService.findOne({ email: email.toLowerCase() });

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with email ${email} does not exist`);
      }

      await this.service.updatePassword(user._id.toString(), password);
      await this.sessionService.deleteById(sessionId);

      return createResponse(StatusCode.OK, "Password updated successfully");
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  };

  comparePasswords = async (event: APIGatewayEvent) => {
    const { email, password, error } = this.getParamsOrError(event, ["email", "password"], "body");

    if (error) return error;

    try {
      const match = await this.service.comparePasswords(email, password);

      return this.successResponse({
        status: match ? StatusCode.OK : StatusCode.UNAUTHORIZED,
        data: match,
        message: match ? "Passwords match!" : "Passwords do not match!",
      });
    } catch (error: any) {
      return this.errorResponse(error);
    }
  };
}

export default PasswordsController;
