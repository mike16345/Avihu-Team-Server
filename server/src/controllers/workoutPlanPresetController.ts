import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import BaseController from "./BaseController";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createResponse, createResponseWithData, createServerErrorResponse, extractBodyFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

const workoutPlanPresetService=new WorkoutPlanPresetService();

export class WorkoutPlanPresetsController extends BaseController<IWorkoutPlanPreset,WorkoutPlanPresetService> {
  constructor(){
    super(new WorkoutPlanPresetService());
  }

   getWorkoutPlanPresetById=async(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult>=> {
    const id = event.queryStringParameters?.presetId;

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan preset ID is required!");
    }
  
    try {
      const workoutPlanPreset = await workoutPlanPresetService.findById(id); //base controller requires event not id

    

      return createResponseWithData(StatusCode.OK, workoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  updateWorkoutPlanPresetById=async(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult>=> {
    const id = event.queryStringParameters?.presetId;
    const data=extractBodyFromEvent(event);

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan preset ID is required!");
    }

    try {
      const updatedWorkoutPlanPreset = await workoutPlanPresetService.updateById(id,data); //base controller requires event not id


      return createResponseWithData(StatusCode.OK, updatedWorkoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  
  }
  deleteWorkoutPlanPresetById=async(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult>=> {
    const id = event.queryStringParameters?.presetId;

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan preset ID is required!");
    }

    try {
      const deletedWorkoutPlanPreset  = await workoutPlanPresetService.deleteById(id); //base controller requires event not id


      return createResponseWithData(StatusCode.OK, deletedWorkoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  
  }

    


}
