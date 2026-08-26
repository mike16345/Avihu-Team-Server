import { APIGatewayProxyResult } from "aws-lambda";
import { IWeeklyFeedback, IWeeklyFeedbackPayload } from "../interfaces/IWeeklyFeedback";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import WeeklyFeedbackService from "../services/weeklyFeedbackService";
import { AppEvent } from "../types/lambdaTypes";

class WeeklyFeedbackController extends BaseController<IWeeklyFeedback, WeeklyFeedbackService> {
  constructor() {
    super(new WeeklyFeedbackService());
  }

  upsertForCurrentUser = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const userId = event.authUser?._id?.toString();
    if (!userId) {
      return this.errorResponse("Unauthorized", StatusCode.UNAUTHORIZED);
    }

    const payload = extractBodyFromEvent(event) as IWeeklyFeedbackPayload;

    try {
      const doc = await this.service.upsertForWeek(userId, payload);

      return this.successResponse({
        status: StatusCode.OK,
        data: doc,
        message: "Weekly feedback saved",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getByUserId = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);
    if (error) return error;

    const limitParam = event.queryStringParameters?.limit;
    const limit = limitParam ? Number(limitParam) : undefined;

    try {
      const docs = await this.service.getByUserId(id as string, limit);

      return this.successResponse({
        data: docs,
        message: "Weekly feedbacks retrieved",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getByWeek = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const { error, id, weekStart } = this.getParamsOrError(event, ["id", "weekStart"]);
    if (error) return error;

    try {
      const doc = await this.service.getByWeek(id as string, weekStart as string);
      if (!doc) {
        return this.errorResponse("Weekly feedback not found", StatusCode.NOT_FOUND);
      }

      return this.successResponse({
        data: doc,
        message: "Weekly feedback retrieved",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}

export default WeeklyFeedbackController;
