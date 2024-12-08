import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanPresetsService } from "../services/dietPlanPresetsService";
import { StatusCode } from "../enums/StatusCode";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  removeNestedIds,
} from "../utils/utils";

class DietPlanPresetController {
  static addDietPlanPreset = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const dietPlanPreset = JSON.parse(event.body || "{}");

    if (!dietPlanPreset) {
      return createResponse(StatusCode.BAD_REQUEST, "Diet Plan Preset data is required.");
    }

    try {
      const dietPlanPresetResult = await DietPlanPresetsService.addDietPlanPreset(dietPlanPreset);
      return createResponseWithData(
        StatusCode.CREATED,
        dietPlanPresetResult,
        "Successfully added diet plan preset!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static updateDietPlanPreset = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const dietPlanPresetId = event.queryStringParameters?.id || "";
    const newDietPlanPreset = removeNestedIds(JSON.parse(event.body || "{}"));

    if (!dietPlanPresetId) {
      return createResponse(StatusCode.BAD_REQUEST, "Diet Plan Preset ID is required.");
    }

    try {
      const updatedDietPlanPreset = await DietPlanPresetsService.updateDietPlanPreset(
        dietPlanPresetId,
        newDietPlanPreset
      );

      if (!updatedDietPlanPreset) {
        return createResponse(StatusCode.NOT_FOUND, "Diet Plan Preset not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        updatedDietPlanPreset,
        "Successfully updated diet plan preset!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static deleteDietPlanPreset = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Diet Plan Preset ID is required.");
    }

    try {
      const response = await DietPlanPresetsService.deleteDietPlanPreset(id);

      if (typeof response === "string") {
        return createResponse(StatusCode.NOT_FOUND, response);
      }

      return createResponseWithData(
        StatusCode.OK,
        response,
        "Successfully deleted diet plan preset!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getDietPlanPresets = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      const dietPlanPresets = await DietPlanPresetsService.getAllDietPlanPresets();

      return createResponseWithData(
        StatusCode.OK,
        dietPlanPresets,
        "Successfully retrieved diet plan presets!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getDietPlanPresetById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const dietPlanPresetId = event.queryStringParameters?.id || "";

    if (!dietPlanPresetId) {
      return createResponse(
        StatusCode.BAD_REQUEST,
        "Diet Plan Preset ID is required and should be a string."
      );
    }

    try {
      const dietPlanPreset = await DietPlanPresetsService.getDietPlanPresetById(dietPlanPresetId);

      if (!dietPlanPreset) {
        return createResponse(StatusCode.NOT_FOUND, "Diet Plan Preset not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        dietPlanPreset,
        "Successfully retrieved diet plan preset!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };
}

export default DietPlanPresetController;
