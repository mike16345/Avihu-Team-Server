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

  static async createCheckIn(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { email } = JSON.parse(event.body || "{}");

    try {
      const newCheckIn = await AnalyticsService.createNewCheckIn(email);

      if (!newCheckIn) {
        return createResponse(StatusCode.INTERNAL_SERVER_ERROR, "Error creating new check-in");
      }

      return createResponse(StatusCode.OK, "Check-in created successfully");
    } catch (error: any) {
      return createServerErrorResponse(error);
    }
  }

  static async updateCheckIn(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const id = event.queryStringParameters?.id || "";

    try {
      const updatedCheckIn = await AnalyticsService.updateCheckIn(id);

      if (!updatedCheckIn) {
        return createResponse(StatusCode.INTERNAL_SERVER_ERROR, "Error updating check-in");
      }

      return createResponse(StatusCode.OK, "Check-in updated successfully");
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

  static async getUsersWithNoPlans(req: Request, res: Response) {
    const { collection } = req.params;

    console.log(collection);

    try {
      const users = await AnalyticsService.getUsersWithoutPlans(collection);

      if (!users) {
        res.status(StatusCode.BAD_REQUEST).send({ message: `collections is required` });
      }

      return res.send(users);
    } catch (error: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: error });
    }
  }

  static async getUsersFinishingThisMonth(req: Request, res: Response) {
    try {
      const users = await AnalyticsService.getUsersFinishingThisMonth();

      res.send(users);
    } catch (error) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: error });
    }
  }
}
