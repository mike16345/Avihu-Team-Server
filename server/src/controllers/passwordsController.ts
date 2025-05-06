import { type APIGatewayEvent } from "aws-lambda";
import PasswordsService from "../services/PasswordsService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
  isSessionExpired,
} from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import SessionService from "../services/sessionService";
import { ONE_MINUTE_IN_MILLISECONDS, ONE_WEEK_IN_SECONDS } from "../constants/Constants";

class PasswordsController {
  static async hashPassword(event: APIGatewayEvent) {
    try {
      const { email, password } = extractBodyFromEvent(event);

      if (!email || !password) {
        return createResponse(StatusCode.BAD_REQUEST, "Missing email or password");
      }

      const user = (await UserService.getUsersByParameter({ email: email.toLowerCase() })).at(0);
      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with email ${email} does not exist`);
      }
      await PasswordsService.hashPassword(user?._id.toString(), password);

      return createResponse(StatusCode.OK, "Encrypted password!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updatePassword(event: APIGatewayEvent) {
    const { email, password, sessionId } = extractBodyFromEvent(event);

    if (!sessionId) {
      return createResponse(StatusCode.UNAUTHORIZED, "");
    }

    const session = await SessionService.getSessionById(sessionId);

    if (!session) {
      return createResponse(StatusCode.UNAUTHORIZED, "");
    }

    if (isSessionExpired(session, ONE_MINUTE_IN_MILLISECONDS * 10)) {
      return createResponse(StatusCode.UNAUTHORIZED, "OTP is expired");
    }

    try {
      const user = (await UserService.getUsersByParameter({ email: email.toLowerCase() })).at(0);

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with email ${email} does not exist`);
      }
      await PasswordsService.updatePassword(user._id.toString(), password);
      await SessionService.endSession(sessionId);

      return createResponse(StatusCode.OK, `Password updated successfully`);
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  }

  static async comparePasswords(event: APIGatewayEvent) {
    const { email, password } = extractBodyFromEvent(event);

    if (!email || !password) {
      return createResponse(StatusCode.BAD_REQUEST, "Missing email or password");
    }

    try {
      const match = await PasswordsService.comparePasswords(email, password);

      if (!match) {
        return createResponse(
          StatusCode.UNAUTHORIZED,
          `Did not find password for user with email: ${email}`
        );
      }

      return createResponseWithData(StatusCode.OK, true, "Passwords match!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}

export default PasswordsController;
