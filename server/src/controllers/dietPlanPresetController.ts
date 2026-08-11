import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanPresetsService } from "../services/dietPlanPresetsService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IDietPlanPreset } from "../interfaces/IDietPlan";

export class DietPlanPresetController extends BaseController<
  IDietPlanPreset,
  DietPlanPresetsService
> {
  constructor() {
    super(new DietPlanPresetsService());
  }

  private getRequestedVersion(event: APIGatewayProxyEvent): 1 | 2 | null {
    const value = event.queryStringParameters?.version;

    if (value === undefined || value === "1") return 1;
    if (value === "2") return 2;

    return null;
  }

  getDietPlanPresets = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const version = this.getRequestedVersion(event);

    if (!version) {
      return this.errorResponse("version must be 1 or 2", StatusCode.BAD_REQUEST);
    }

    try {
      const presets = await this.service.listPresets(version);

      return this.successResponse({ data: presets, message: "Successfully found items!" });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getDietPlanPresetById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);

    if (error) return error;

    try {
      const preset = await this.service.getPresetById(id);

      if (!preset) {
        return this.errorResponse("Diet plan preset not found.", StatusCode.NOT_FOUND);
      }

      return this.successResponse({ data: preset });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  createDietPlanPreset = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      const created = await this.service.createPreset(extractBodyFromEvent(event));

      return this.successResponse({ status: StatusCode.CREATED, data: created });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateDietPlanPreset = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);
    const data = extractBodyFromEvent(event);

    if (error) return error;

    try {
      const updatedDietPlanPreset = await this.service.replacePresetById(id, data);

      if (!updatedDietPlanPreset) {
        return this.errorResponse("Diet plan preset not found.", StatusCode.NOT_FOUND);
      }

      return this.successResponse({
        status: StatusCode.OK,
        data: updatedDietPlanPreset,
        message: "Successfully updated diet plan preset!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  deleteDietPlanPreset = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);

    if (error) return error;

    try {
      const deleted = await this.service.deletePresetById(id);

      if (!deleted) {
        return this.errorResponse("Diet plan preset not found.", StatusCode.NOT_FOUND);
      }

      return this.successResponse({ data: deleted, message: "פריט נמחק בהצלחה!" });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
