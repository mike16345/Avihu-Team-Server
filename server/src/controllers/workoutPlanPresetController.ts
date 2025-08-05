import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import BaseController from "./BaseController";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import { IWorkoutPlanPreset } from "../models/workoutPlanPresetModel";

export class WorkoutPlanPresetsController extends BaseController<
  IWorkoutPlanPreset,
  WorkoutPlanPresetService
> {
  constructor() {
    super(new WorkoutPlanPresetService());
  }

  addWorkoutPlanPreset = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const body = extractBodyFromEvent(event);
    if (!body) {
      return this.errorResponse("Workout plan preset data is required!", StatusCode.BAD_REQUEST);
    }

    try {
      const newPreset = await this.service.addWorkoutPlanPreset(body);

      return this.successResponse({
        status: StatusCode.CREATED,
        data: newPreset,
        message: "Successfully added workout plan preset!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getWorkoutPlanPresetById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const { presetId, error } = this.getParamsOrError(event, ["presetId"]);

    if (error) return error;

    try {
      const workoutPlanPreset = await this.service.findById(presetId);

      return this.successResponse({ status: StatusCode.OK, data: workoutPlanPreset });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateWorkoutPlanPresetById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const data = extractBodyFromEvent(event);
    const { error, presetId } = this.getParamsOrError(event, ["presetId"]);

    if (error) return error;

    try {
      const updatedWorkoutPlanPreset = await this.service.updateWorkoutPlanPreset(data, presetId);

      return this.successResponse({ status: StatusCode.OK, data: updatedWorkoutPlanPreset });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
  deleteWorkoutPlanPresetById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const { presetId, error } = this.getParamsOrError(event, ["presetId"]);

    if (error) return error;

    try {
      const deletedWorkoutPlanPreset = await this.service.deleteById(presetId);

      return this.successResponse({ status: StatusCode.OK, data: deletedWorkoutPlanPreset });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
