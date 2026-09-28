import { APIGatewayProxyResult } from "aws-lambda";
import { IWeeklyFeedback, IWeeklyFeedbackPayload } from "../interfaces/IWeeklyFeedback";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import WeeklyFeedbackService from "../services/weeklyFeedbackService";
import { AppEvent } from "../types/lambdaTypes";
import { getAuthContext } from "../utils/authContext";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MOBILE_EDIT_WINDOW_DAYS = 14;

const enforceSelfOrElevated = (targetUserId: string) => {
  const ctx = getAuthContext();
  if (!ctx?.role || !ctx?.userId) {
    throw { status: StatusCode.UNAUTHORIZED, message: "Auth context missing" };
  }
  if (ctx.role === "user" && ctx.userId !== targetUserId) {
    throw { status: StatusCode.FORBIDDEN, message: "Cannot access another user's weekly feedback" };
  }
};

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
      const ctx = getAuthContext();
      if (ctx?.role === "user") {
        const weekStartMs = new Date(payload.weekStart).getTime();
        const nowMs = Date.now();
        if (weekStartMs > nowMs + ONE_DAY_MS) {
          throw { status: StatusCode.BAD_REQUEST, message: "לא ניתן להזין פידבק לשבוע עתידי" };
        }
        if (nowMs - weekStartMs > MOBILE_EDIT_WINDOW_DAYS * ONE_DAY_MS) {
          throw {
            status: StatusCode.FORBIDDEN,
            message: "לא ניתן לערוך פידבק היסטורי מהמובייל",
          };
        }
        const existing = await this.service.getByWeek(userId, payload.weekStart);
        if (existing?.finalized) {
          throw {
            status: StatusCode.FORBIDDEN,
            message: "השבוע כבר סוכם ולא ניתן לשנותו",
          };
        }
      }

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
    const { error, userId } = this.getParamsOrError(event, ["userId"]);
    if (error) return error;

    const limitParam = event.queryStringParameters?.limit;
    const limit = limitParam ? Number(limitParam) : undefined;

    try {
      enforceSelfOrElevated(userId as string);
      const docs = await this.service.getByUserId(userId as string, limit);

      return this.successResponse({
        data: docs,
        message: "Weekly feedbacks retrieved",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getByWeek = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, weekStart } = this.getParamsOrError(event, ["userId", "weekStart"]);
    if (error) return error;

    try {
      enforceSelfOrElevated(userId as string);
      const doc = await this.service.getByWeek(userId as string, weekStart as string);
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
