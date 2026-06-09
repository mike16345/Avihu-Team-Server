import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { WorkoutPlanService } from "../services/workoutPlanService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";

class WorkoutPlanController extends BaseController<IFullWorkoutPlan, WorkoutPlanService> {
  constructor() {
    super(new WorkoutPlanService());
  }

  addWorkoutPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id: userId } = this.getParamsOrError(event, ["id"]);
    const body = extractBodyFromEvent(event);

    const workoutPlan = { ...body, userId: userId };

    if (!body || error) {
      return error || this.errorResponse("Workout plan data is required!", StatusCode.BAD_REQUEST);
    }

    try {
      const workoutPlanResult = await this.service.create(workoutPlan);

      return this.successResponse({
        status: StatusCode.CREATED,
        data: workoutPlanResult,
        message: "Successfully added workout plan!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateWorkoutPlan = async (event: APIGatewayProxyEvent) => {
    const { error, id: userId } = this.getParamsOrError(event, ["userId"]);
    const body = extractBodyFromEvent(event);

    if (error) {
      return error;
    }

    try {
      const updatedPlan = await this.service.updateWorkoutPlan(body, userId);

      return this.successResponse({
        status: StatusCode.OK,
        data: updatedPlan,
        message: "Successfully updated workout plan!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  // ===========================================================
  // Plan history / temporary-swap endpoints (frontend already
  // wired — see admin-app WorkoutPlanHistorySection). Mobile is
  // unaffected; all mutations preserve the "one active doc per
  // userId" invariant.
  // ===========================================================

  /** GET /workoutPlans/history?userId=... — archived plans, newest first. */
  getHistory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id: userId } = this.getParamsOrError(event, ["userId"]);
    if (error) return error;

    try {
      const history = await this.service.getHistoryForUser(userId);
      return this.successResponse({
        status: StatusCode.OK,
        data: history,
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  /**
   * POST /workoutPlans/swap?userId=... — archive current active
   * plan + insert new active one in one atomic operation. Body is
   * the new plan (ICompleteWorkoutPlan + optional history fields).
   */
  swapWorkoutPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id: userId } = this.getParamsOrError(event, ["userId"]);
    const body = extractBodyFromEvent(event);

    if (!body || error) {
      return error || this.errorResponse("New plan body is required", StatusCode.BAD_REQUEST);
    }

    try {
      const newPlan = await this.service.swapWorkoutPlan(userId, body);
      return this.successResponse({
        status: StatusCode.CREATED,
        data: newPlan,
        message: "Plan swapped — previous plan moved to history",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  /**
   * POST /workoutPlans/restore?userId=...&archivedPlanId=... —
   * clones an archived plan back to active. Current active is
   * archived in the same operation.
   */
  restoreWorkoutPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id: userId } = this.getParamsOrError(event, ["userId"]);
    if (error) return error;

    const query = (event.queryStringParameters || {}) as Record<string, string>;
    const archivedPlanId = query.archivedPlanId;
    if (!archivedPlanId) {
      return this.errorResponse("archivedPlanId is required", StatusCode.BAD_REQUEST);
    }

    const body = extractBodyFromEvent(event) || {};
    const assignedBy = body.assignedBy;

    try {
      const restoredPlan = await this.service.restoreWorkoutPlan(
        userId,
        archivedPlanId,
        assignedBy
      );
      return this.successResponse({
        status: StatusCode.CREATED,
        data: restoredPlan,
        message: "Plan restored",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}

export default WorkoutPlanController;
