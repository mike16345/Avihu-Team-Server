import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import BaseController from "./BaseController";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";

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
    const { presetId } = this.getParamsOrError(event, ["presetId"]);

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
    const { presetId, data } = this.getParamsOrError(event, ["presetId", "data"], "body");

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
    const { presetId } = this.getParamsOrError(event, ["presetId"]);

    try {
      const deletedWorkoutPlanPreset = await this.service.deleteById(presetId);

      return this.successResponse({ status: StatusCode.OK, data: deletedWorkoutPlanPreset });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
