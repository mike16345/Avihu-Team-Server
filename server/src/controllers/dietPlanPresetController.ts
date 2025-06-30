import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanPresetsService } from "../services/dietPlanPresetsService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent, removeNestedIds } from "../utils/utils";
import BaseController from "./BaseController";
import { IDietPlanPreset } from "../interfaces/IDietPlan";

export class DietPlanPresetController extends BaseController<
  IDietPlanPreset,
  DietPlanPresetsService
> {
  constructor() {
    super(new DietPlanPresetsService());
  }

  updateDietPlanPreset = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id",]);
    const data=extractBodyFromEvent(event);
    const newDietPlanPreset = removeNestedIds(data);

    if (error) return error;

    try {
      const updatedDietPlanPreset = await this.service.updateById(id, newDietPlanPreset);

      return this.successResponse({
        status: StatusCode.OK,
        data: updatedDietPlanPreset,
        message: "Successfully updated diet plan preset!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
