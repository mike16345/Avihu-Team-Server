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
import bcrypt from "bcryptjs";
import SessionService from "../services/sessionService";
import { ISessionCreate } from "../models/sessionModel";

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
      const user = (await UserService.getUsersByParameter({ email })).pop();

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `משתמש לא נמצא!`);
      }

      if (!user.hasAccess) {
        return createResponse(StatusCode.UNAUTHORIZED, `אין גישה לכתובת המייל`);
      }

      return createResponseWithData(StatusCode.OK, user, "פעולה בוצעה בהצלחה!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async register(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const { email, password } = JSON.parse(event.body || "{}");

      const hashedPassword = await bcrypt.hash(password || "", 10);

      const user = await UserService.register(email, hashedPassword);

      if (!user) {
        return createResponse(StatusCode.NOT_FOUND, `משתמש לא נמצא!`);
      }

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
      const { email, password } = JSON.parse(event.body || "{}");
      const users = await UserService.getUsersByParameter({ email });
      const user = users.pop();

    console.log("users", users);
      if (!user || (await !bcrypt.compare(password || ``, user.password))) {
        return createResponse(StatusCode.NOT_FOUND, `מייל או סיסמא שגויים!`);
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

      await SessionService.refreshSession(token._id);

      return createResponseWithData(!!session ? StatusCode.OK : StatusCode.UNAUTHORIZED, {
        isValid: !!session,
      });
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }
}
