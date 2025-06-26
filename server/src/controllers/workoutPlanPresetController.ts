import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import BaseController from "./BaseController";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createResponse, createResponseWithData, createServerErrorResponse, extractBodyFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";


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
      const workoutPlanPreset = await this.service.findById(id); 

    

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
      const updatedWorkoutPlanPreset = await this.service.updateById(id,data); 


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
      const deletedWorkoutPlanPreset  = await this.service.deleteById(id); 


      return createResponseWithData(StatusCode.OK, deletedWorkoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  
  }

    


}
