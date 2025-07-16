import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { WorkoutPlanService } from "../services/workoutPlanService";
import { StatusCode } from "../enums/StatusCode";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
} from "../utils/utils";
import BaseController from "./BaseController";
import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";

class WorkoutPlanController extends BaseController<IFullWorkoutPlan, WorkoutPlanService> {
  constructor() {
    super(new WorkoutPlanService());
  }

  addWorkoutPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = event?.queryStringParameters?.id;
    const body = extractBodyFromEvent(event);

    const workoutPlan = { ...body, userId: userId };

    if (!body) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan data is required.");
    }

    try {
      const workoutPlanResult = await this.create(workoutPlan);

      return createResponseWithData(
        StatusCode.CREATED,
        workoutPlanResult,
        "Successfully added workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };
}

export default WorkoutPlanController;
