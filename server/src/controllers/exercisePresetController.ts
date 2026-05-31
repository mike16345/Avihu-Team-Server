import { ExercisePresetService } from "../services/exercisePresetService";
import BaseController from "./BaseController";
import { IExercisePreset } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractBodyFromEvent } from "../utils/utils";
import { DUPLICATE_PRESET_ERROR } from "../constants/Constants";
import { MongoCode } from "../enums/MongoCode";

export class ExercisePresetController extends BaseController<
  IExercisePreset,
  ExercisePresetService
> {
  constructor() {
    super(new ExercisePresetService());
  }

  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const payload = extractBodyFromEvent(event);

      if (!payload) {
        return this.errorResponse({ message: "Cannot create item with no body!" });
      }

      const item = await this.service.createExercisePreset(payload);
      const response = this.successResponse({ data: item });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      if (e?.code == MongoCode.DUPLICATE_KEY) {
        e.message = DUPLICATE_PRESET_ERROR;
      }

      return this.errorResponse(e);
    }
  };
}
