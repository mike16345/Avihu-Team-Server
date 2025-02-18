import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import SessionService from "../services/sessionService";
import { ISessionCreate } from "../models/sessionModel";
import PasswordsService from "../services/PasswordsService";

export class UserController {
  static async addUser(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const user = await UserService.createUser(JSON.parse(event.body || "{}"));

      return createResponseWithData(StatusCode.CREATED, user, "User  created successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getUsers(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const users = await UserService.getUsers();

      return createResponseWithData(StatusCode.OK, users, "Users retrieved succesfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getUser(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const id = event.queryStringParameters?.userId;
      const user = await UserService.getUser(id || "");

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with id: "${id}" not found!`);
      }

      return createResponseWithData(StatusCode.OK, user, "User retrieved successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updateUser(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const id = event.queryStringParameters?.id;
      const user = await UserService.updateUser(JSON.parse(event.body || "{}"), id || "");

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with id: "${id}" not found!`);
      }

      return createResponseWithData(StatusCode.OK, user, "User updated successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updateManyUsers(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const users = await UserService.updateManyUsers(JSON.parse(event.body || "{}"));

      return createResponseWithData(StatusCode.OK, users, "Users updated successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updateUserField(event: APIGatewayEvent, context: Context) {
    const body = extractBodyFromEvent(event);
    const { userId } = extractQueryFromEvent(event);

    if (!userId || !body) {
      return createResponse(StatusCode.BAD_REQUEST, "Missing userId or body");
    }

    try {
      const user = await UserService.updateUserField(userId, body.fieldName, body.value);

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with id: "${userId}" not found!`);
      }

      return createResponseWithData(StatusCode.OK, user, "User updated successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async deleteUser(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const id = event.queryStringParameters?.id;
      const user = await UserService.deleteUser(id || "");

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with id: "${id}" not found!`);
      }

      return createResponseWithData(StatusCode.OK, user, "User deleted successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updateImagesUploadedstatus(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const id = event.queryStringParameters?.userId;
      const status = event.queryStringParameters?.status;
      const user = await UserService.updateImagesUploadedstatus(id || "", status);

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `User with id: "${id}" not found!`);
      }

      return createResponseWithData(StatusCode.OK, user, "Status updated successfully!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async checkUsersAccess(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const email = event.queryStringParameters?.email;

    try {
      const user = (await UserService.getUsersByParameter({ email: email?.toLowerCase() })).pop();

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `משתמש לא נמצא!`);
      }

      if (!user.hasAccess) {
        return createResponse(StatusCode.UNAUTHORIZED, `אין גישה לכתובת המייל`);
      }
      const hasPassword = await PasswordsService.findPasswordByUserId(user._id.toString());

      return createResponseWithData(StatusCode.OK, { user, hasPassword }, "פעולה בוצעה בהצלחה!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async register(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const { email, password } = extractBodyFromEvent(event);
      const user = (await UserService.getUsersByParameter({ email: email.toLowerCase() })).at(0);

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `משתמש לא נמצא!`);
      }

      if (!user.hasAccess) {
        return createResponse(StatusCode.FORBIDDEN, `אין גישה לכתובת המייל`);
      }

      await PasswordsService.hashPassword(user._id.toString(), password);

      return createResponseWithData(StatusCode.OK, user, "סיסמה נשמרה במערכת!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async logIn(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const { email, password, isAdminApp } = JSON.parse(event.body || "{}");
      const user = (await UserService.getUsersByParameter({ email })).at(0);

      const isSamePassword =
        user && (await PasswordsService.comparePasswords(user._id.toString(), password));

      if (!user || !isSamePassword) {
        return createResponse(StatusCode.NOT_FOUND, `מייל או סיסמא שגויים!`);
      }

      if (isAdminApp && !user.isAdmin) {
        return createResponse(StatusCode.FORBIDDEN, "אין הרשאה להתחבר כמנהל!");
      }

      const sessionData: ISessionCreate = {
        userId: user._id.toString(),
        data: { user },
        type: "login",
      };
      const session = await SessionService.startSession(sessionData);

      return createResponseWithData(StatusCode.OK, session, "התחברות בוצעה בהצלחה!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async checkUserSessionToken(event: APIGatewayEvent, context: Context) {
    try {
      const { token } = extractBodyFromEvent(event);
      const session = await SessionService.getSessionById(token._id);
      const userId = token.data.user._id;
      const user = await UserService.getUser(userId);

      await SessionService.refreshSession(token._id);
      if (!user.hasAccess) {
        await SessionService.endSession(token._id);
      }

      return createResponseWithData(!!session ? StatusCode.OK : StatusCode.UNAUTHORIZED, {
        isValid: !!session,
        hasAccess: user.hasAccess,
      });
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }
}
