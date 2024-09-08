import { type APIGatewayEvent } from "aws-lambda";
import PasswordsService from "../services/PasswordsService";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

class PasswordsController {
  static async hashPassword(event: APIGatewayEvent) {
    try {
      const { email, password } = JSON.parse(event.body || "{}");
      if (!email || !password) {
        return createResponse(StatusCode.BAD_REQUEST, "Missing email or password");
      }

      const res = await PasswordsService.hashPassword(email, password);
      if (!res) {
        return createResponse(StatusCode.NOT_FOUND, `User with email ${email} does not exist`);
      }

      return createResponse(StatusCode.OK, "Encrypted password!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async comparePasswords(event: APIGatewayEvent) {
    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return createResponse(StatusCode.BAD_REQUEST, "Missing email or password");
    }
    try {
      const match = await PasswordsService.comparePasswords(email, password);

      return createResponseWithData(StatusCode.OK, true, "Encrypted password!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}

export default PasswordsController;
