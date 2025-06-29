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
      return this.errorResponse({message:"Workout plan preset ID is required!"
      },StatusCode.BAD_REQUEST)
    }
  
    try {
      const workoutPlanPreset = await this.service.findById(id); 

    

      return this.successResponse({status:StatusCode.OK,data:workoutPlanPreset})
    } catch (err: any) {
      return this.errorResponse(err) 
    }
  }

  updateWorkoutPlanPresetById=async(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult>=> {
    const id = event.queryStringParameters?.presetId;
    const data=extractBodyFromEvent(event);

    if (!id) {
      return this.errorResponse({message:"Workout plan preset ID is required!"},StatusCode.BAD_REQUEST)
    }

    try {
      const updatedWorkoutPlanPreset = await this.service.updateById(id,data); 


      return this.successResponse({status:StatusCode.OK,data:updatedWorkoutPlanPreset})
    } catch (err: any) {
      return this.errorResponse(err) 
    }
  
  }
  deleteWorkoutPlanPresetById=async(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult>=> {
    const id = event.queryStringParameters?.presetId;

    if (!id) {
      return this.errorResponse({message:"Workout plan preset ID is required!"},StatusCode.BAD_REQUEST)
    }

    try {
      const deletedWorkoutPlanPreset  = await this.service.deleteById(id); 

      return this.successResponse({status:StatusCode.OK,data:deletedWorkoutPlanPreset})
    } catch (err: any) {
      return this.errorResponse(err) 
    }
  
  }

    


}
