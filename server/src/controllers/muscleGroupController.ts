import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { MuscleGroupService } from "../services/muscleGroupService";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

export default class MuscleGroupController {
  static async getAllMuscleGroups(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allMuscleGroups = await MuscleGroupService.getAllMuscleGroups();

      if (!allMuscleGroups) {
        return createResponse(StatusCode.NOT_FOUND, "Could not find any muscle groups!");
      }

      return createResponseWithData(
        StatusCode.OK,
        allMuscleGroups,
        "Muscle groups retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getMuscleGroupById(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const muscleGroup = await MuscleGroupService.getMuscleGroupById(id || "");

      if (!muscleGroup) {
        return createResponse(StatusCode.NOT_FOUND, "Muscle group not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        muscleGroup,
        "Muscle group retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async addMuscleGroup(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const muscleGroup = JSON.parse(event.body || "{}");

    try {
      const newMuscleGroup = await MuscleGroupService.addMuscleGroup(muscleGroup);

      if (!newMuscleGroup) {
        return createResponse(StatusCode.BAD_REQUEST, "Failed to add muscle group!");
      }

      return createResponseWithData(
        StatusCode.CREATED,
        newMuscleGroup,
        "Muscle group added successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async editMuscleGroup(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const muscleGroup = JSON.parse(event.body || "{}");
    const { id } = event.queryStringParameters || {};

    try {
      const updatedMuscleGroup = await MuscleGroupService.editMuscleGroup(muscleGroup, id || "");

      if (!updatedMuscleGroup) {
        return createResponse(StatusCode.NOT_FOUND, "Muscle group not found or failed to update!");
      }

      return createResponseWithData(
        StatusCode.OK,
        updatedMuscleGroup,
        "Muscle group updated successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async deleteMuscleGroup(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedMuscleGroup = await MuscleGroupService.deleteMuscleGroup(id || "");

      if (!deletedMuscleGroup) {
        return createResponse(StatusCode.NOT_FOUND, "Muscle group not found or failed to delete!");
      }

      return createResponseWithData(
        StatusCode.OK,
        deletedMuscleGroup,
        "Muscle group deleted successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
}
