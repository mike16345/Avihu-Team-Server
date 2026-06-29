import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import BaseController from "./BaseController";
import { IStepsProgress } from "../interfaces/IStepsProgress";
import { StepsProgressService } from "../services/stepsProgressService";
import { StatusCode } from "../enums/StatusCode";
import { AppEvent } from "../types/lambdaTypes";
import { extractBodyFromEvent } from "../utils/utils";

class StepsProgressController extends BaseController<IStepsProgress, StepsProgressService> {
  constructor() {
    super(new StepsProgressService());
  }

  syncMine = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const userId = event.authUser?._id?.toString();
    const body = extractBodyFromEvent(event);

    if (!userId) {
      return this.errorResponse("Authenticated user is required", StatusCode.UNAUTHORIZED);
    }

    try {
      const synced = await this.service.syncDailyProgress(userId, body);

      return this.successResponse({
        status: StatusCode.OK,
        data: synced,
        message: "Steps synced successfully",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getMine = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const userId = event.authUser?._id?.toString();
    const query = event.queryStringParameters ?? {};

    if (!userId) {
      return this.errorResponse("Authenticated user is required", StatusCode.UNAUTHORIZED);
    }

    try {
      const data = await this.service.getUserRange(userId, query.from, query.to);

      return this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Steps progress retrieved successfully",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, from, to } = this.getParamsOrError(event, ["userId"]);
    if (error) return error;

    try {
      const data = await this.service.getUserRange(userId, from, to);

      return this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Steps progress retrieved successfully",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}

export default StepsProgressController;
