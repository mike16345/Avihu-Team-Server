import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { OTPService } from "../services/OTPService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
  generateOTP,
  generateUUID,
} from "../utils/utils";
import { Cache } from "../utils/cache";
import { ONE_MINUTE_IN_MILLISECONDS } from "../constants/Constants";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import SessionService from "../services/sessionService";

const cache = new Cache();

export class OTPController {
  static async confirmOtp(event: APIGatewayProxyEvent) {
    try {
      const { email } = extractBodyFromEvent(event);
      const cacheKey = `otp:${email}`;
      const otp = cache.get(cacheKey);

      if (!otp) {
        return createResponse(StatusCode.NOT_FOUND, "OTP not found or expired");
      }

      const isValidOtp = otp === extractBodyFromEvent(event).otp;

      if (!isValidOtp) {
        return createResponse(StatusCode.NOT_ACCEPTABLE, "Invalid OTP");
      }
      const session = await SessionService.startSession({ userId: email, type: "otp" });

      cache.invalidate(cacheKey);

      return createResponseWithData(
        StatusCode.OK,
        { changePasswordSessionId: session._id.toString() },
        "OTP successfully verified"
      );
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }

  static async generateAndSendOTP(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const { email } = extractBodyFromEvent(event);

      if (!email) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Email is required" }),
        };
      }
      const user = (await UserService.getUsersByParameter({ email: email.toLowerCase() })).at(0);

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, "מייל הזו לא קיים במערכת");
      }

      const otpService = new OTPService();
      const otp = generateOTP();
      const cacheKey = `otp:${email}`;

      cache.set(cacheKey, otp, { expireAfter: ONE_MINUTE_IN_MILLISECONDS * 2 });

      await otpService.sendOTPEmail(email, otp);

      return createResponseWithData(StatusCode.OK, undefined, "OTP sent successfully");
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }
}
