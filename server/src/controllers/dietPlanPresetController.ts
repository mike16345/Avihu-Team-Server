import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanPresetsService } from "../services/dietPlanPresetsService";
import { StatusCode } from "../enums/StatusCode";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  removeNestedIds,
} from "../utils/utils";
import BaseController from "./BaseController";
import { IDietPlanPreset } from "../interfaces/IDietPlan";

export class DietPlanPresetController extends BaseController<IDietPlanPreset,DietPlanPresetsService> {
  constructor(){
    super(new DietPlanPresetsService())
  }

  

   updateDietPlanPreset = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const {error,id}=this.getIdOrError(event)
    const newDietPlanPreset = removeNestedIds(JSON.parse(event.body || "{}"));

    if (error) return error

    try {
      const updatedDietPlanPreset = await this.service.updateById(id,newDietPlanPreset);

  

      return createResponseWithData(
        StatusCode.OK,
        updatedDietPlanPreset,
        "Successfully updated diet plan preset!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }; 

 



}

