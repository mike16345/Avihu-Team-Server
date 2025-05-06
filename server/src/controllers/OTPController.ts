import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { EmailService } from "../services/EmailService";
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
      const { email, otp } = extractBodyFromEvent(event);
      const cacheKey = `otp:${email.toLowerCase()}`;
      const cachedOtp = cache.get(cacheKey);

      console.log("Recieved OTP:", otp);
      console.log("Cached OTP:", cachedOtp);

      if (!cachedOtp) {
        return createResponse(StatusCode.NOT_FOUND, "OTP not found or expired");
      }

      const isValidOtp = String(cachedOtp) === String(otp);

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

      const otpService = new EmailService();
      const otp = generateOTP();
      const cacheKey = `otp:${email.toLowerCase()}`;

      cache.set(cacheKey, otp, { expireAfter: ONE_MINUTE_IN_MILLISECONDS * 5 });
      const mailOptions = {
        to: email,
        subject: "קוד אימות - AvihuTeam",
        text: `קוד האימות שלך הוא: ${otp}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2c3e50;">שלום!</h2>
            <p style="font-size: 16px; color: #333;">קוד האימות שלך הוא:</p>
            <p style="font-size: 24px; font-weight: bold; color: #1d4ed8; margin: 15px 0;">${otp}</p>
            <p style="font-size: 14px; color: #666;">הקוד תקף למספר דקות בלבד. נא לא לשתף אותו עם אף אחד.</p>
            <p style="font-size: 16px; margin-top: 20px;">בהצלחה,<br/>צוות AvihuTeam</p>
          </div>
        `,
      };
      await otpService.sendEmail(mailOptions);

      return createResponseWithData(StatusCode.OK, undefined, "OTP sent successfully");
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }
}
