import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

export class WorkoutPlanPresetsController {
  static async addWorkoutPlanPreset(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const data = JSON.parse(event.body || "{}");

    try {
      const workoutPlanPreset = await WorkoutPlanPresetService.addWorkoutPlanPreset(data);

      if (!workoutPlanPreset) {
        return createResponse(
          StatusCode.BAD_REQUEST,
          "There was an error adding the workout plan preset!"
        );
      }

      return createResponseWithData(StatusCode.CREATED, workoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async updateWorkoutPlanPreset(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const id = event.queryStringParameters?.presetId;
    const data = JSON.parse(event.body || "{}");

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan preset ID is required!");
    }

    try {
      const updatedWorkoutPlanPreset = await WorkoutPlanPresetService.updateWorkoutPlanPreset(
        id,
        data
      );

      if (!updatedWorkoutPlanPreset) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan preset was not found!");
      }

      return createResponseWithData(StatusCode.OK, updatedWorkoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async deleteWorkoutPlanPreset(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const id = event.queryStringParameters?.presetId;

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan preset ID is required!");
    }

    try {
      const deletedWorkoutPlanPreset = await WorkoutPlanPresetService.deleteWorkoutPlanPreset(id);

      if (!deletedWorkoutPlanPreset) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan preset was not found!");
      }

      return createResponseWithData(StatusCode.OK, deletedWorkoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getAllWorkoutPlanPresets(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    try {
      const workoutPlanPresets = await WorkoutPlanPresetService.getAllWorkoutPlanPresets();

      return createResponseWithData(StatusCode.OK, workoutPlanPresets);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getWorkoutPlanPresetById(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const id = event.queryStringParameters?.presetId;

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan preset ID is required!");
    }

    try {
      const workoutPlanPreset = await WorkoutPlanPresetService.getWorkoutPlanPresetById(id);

      if (!workoutPlanPreset) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan preset was not found!");
      }

      return createResponseWithData(StatusCode.OK, workoutPlanPreset);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}
