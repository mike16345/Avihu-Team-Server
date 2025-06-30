import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import BaseController from "./BaseController";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";

export class WorkoutPlanPresetsController extends BaseController<
  IWorkoutPlanPreset,
  WorkoutPlanPresetService
> {
  constructor() {
    super(new WorkoutPlanPresetService());
  }

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
      const updatedWorkoutPlanPreset = await this.service.updateById(presetId, data);

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
