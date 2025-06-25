import { ExercisePresetService } from "../services/exercisePresetService";
import BaseController from "./BaseController";
import { IExercisePreset } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

const exercisePresetService=new ExercisePresetService()

export class ExercisePresetController extends BaseController<IExercisePreset> {
  constructor() {
    super(exercisePresetService);
  }


    static getExercisesByMuscleGroup = async (
      event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> => {
      const muscleGroup = event.queryStringParameters?.muscleGroup || "";
  
      if (!muscleGroup) {
        return createResponse(StatusCode.BAD_REQUEST, "Muscle Group is required.");
      }
  
      try {
        const exercises = await exercisePresetService.find({query:{muscleGroup}});
  
  
        return createResponseWithData(
          StatusCode.OK,
          exercises,
          "Successfully retrieved exercises!"
        );
      } catch (err: any) {
        return createServerErrorResponse(err);
      }
    };
}
