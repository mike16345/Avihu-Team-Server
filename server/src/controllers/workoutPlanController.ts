import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {  workoutPlanService } from "../services/workoutPlanService";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse, extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";


class WorkoutPlanController extends BaseController<IFullWorkoutPlan> {
  constructor(){
    super(workoutPlanService);
  }

  static addWorkoutPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = event?.queryStringParameters?.id;
    const body=extractBodyFromEvent(event)

    const workoutPlan = { ...body, userId: userId };

    if (!body) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan data is required.");
    }

    try {
      const workoutPlanResult = await workoutPlanService.create(workoutPlan);

      return createResponseWithData(
        StatusCode.CREATED,
        workoutPlanResult,
        "Successfully added workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };


  static updateWorkoutPlanByUserId = async (event: APIGatewayProxyEvent) => {
    const userId = String(event.queryStringParameters?.userId) || "";
    const updatedData = extractBodyFromEvent(event);

    try {
      const updatedWorkoutPlan = await workoutPlanService.updateOne(
        { userId },
        updatedData
      );


      return createResponseWithData(
        StatusCode.OK,
        updatedWorkoutPlan,
        "Successfully updated workout plan!"
      );
    } catch (err) {
      return createServerErrorResponse(err);
    }
  };

  

  static getWorkoutPlanByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const userId = event.queryStringParameters?.userId || "";

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "User ID is required.");
    }

    try {
      const workoutPlan = await workoutPlanService.findOne({query:{userId}});


      return createResponseWithData(
        StatusCode.OK,
        workoutPlan,
        "Successfully retrieved workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };
}

export default WorkoutPlanController;
