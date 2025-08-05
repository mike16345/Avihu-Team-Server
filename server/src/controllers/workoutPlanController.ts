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
}

export default WorkoutPlanController;
