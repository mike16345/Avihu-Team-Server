import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { AnalyticsService } from "../services/analyticsService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractQueryFromEvent,
} from "../utils/utils";

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

  static async getDashboardSummary(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const summary = await AnalyticsService.getDashboardSummary();

      return createResponseWithData(
        StatusCode.OK,
        summary,
        "Dashboard summary retrieved successfully!"
      );
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }

  static async getDashboardSources(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const { from, to } = extractQueryFromEvent(event);

      if (!from || !to) {
        return createResponse(StatusCode.BAD_REQUEST, '"from to" params are required!');
      }

      if (Number.isNaN(new Date(from).getTime()) || Number.isNaN(new Date(to).getTime())) {
        return createResponse(StatusCode.BAD_REQUEST, "Invalid date range");
      }

      if (new Date(from) > new Date(to)) {
        return createResponse(StatusCode.BAD_REQUEST, '"from" must be before or equal to "to"');
      }

      const sources = await AnalyticsService.getDashboardSources({
        from,
        to,
      });

      return createResponseWithData(
        StatusCode.OK,
        sources,
        "Dashboard sources retrieved successfully!"
      );
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }

  static async getDashboardJoinedByMonth(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    try {
      const { year } = extractQueryFromEvent(event);

      if (!year) {
        return createResponse(StatusCode.BAD_REQUEST, '"year" param is required!');
      }

      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 3000) {
        return createResponse(StatusCode.BAD_REQUEST, "Invalid year");
      }

      const joinedByMonth = await AnalyticsService.getDashboardJoinedByMonth(parsedYear);

      return createResponseWithData(
        StatusCode.OK,
        joinedByMonth,
        "Dashboard joined-by-month analytics retrieved successfully!"
      );
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }

  static async getDashboardTrainersCloseToLimit(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    try {
      const closeToLimit = await AnalyticsService.getDashboardTrainersCloseToLimit();

      return createResponseWithData(
        StatusCode.OK,
        closeToLimit,
        "Dashboard trainers close to limit retrieved successfully!"
      );
    } catch (error) {
      return createServerErrorResponse(error);
    }
  }
}
