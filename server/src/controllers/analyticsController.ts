import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { AnalyticsService } from "../services/analyticsService";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

export class AnalyticsController {
  static async getAllCheckInUsers(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const allCheckInUsers = await AnalyticsService.getAllCheckInUsers();

      return createResponseWithData(StatusCode.OK, allCheckInUsers);
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  }

  static async checkOffUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const id = event.queryStringParameters?.id || "";

    try {
      const checkedUser = await AnalyticsService.checkOffUser(id);

      if (!checkedUser) {
        return createResponse(StatusCode.NOT_FOUND, "User not found");
      }

      return createResponseWithData(StatusCode.OK, checkedUser);
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  }

  static async getUsersWithNoPlans(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const collection = event.queryStringParameters?.collection || "";

    try {
      const users = await AnalyticsService.getUsersWithoutPlans(collection);

      return createResponseWithData(StatusCode.OK, users);
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  }

  static async getUsersFinishingThisMonth(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    try {
      const users = await AnalyticsService.getUsersFinishingThisMonth();

      return createResponseWithData(StatusCode.OK, users);
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }
}
