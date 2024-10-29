import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import UserService from "../services/userService";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

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
}
