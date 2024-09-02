import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { MuscleGroupService } from "../services/muscleGroupService";

export default class MuscleGroupController {
  static async getAllMuscleGroups(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allMuscleGroups = await MuscleGroupService.getAllMuscleGroups();
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Muscle groups retrieved successfully!",
          data: allMuscleGroups,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "An error occurred while retrieving muscle groups.",
          error: error.message,
        }),
      };
    }
  }

  static async getMuscleGroupById(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const muscleGroup = await MuscleGroupService.getMuscleGroupById(id || "");
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Muscle group retrieved successfully!",
          data: muscleGroup,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "An error occurred while retrieving the muscle group.",
          error: error.message,
        }),
      };
    }
  }

  static async addMuscleGroup(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const muscleGroup = JSON.parse(event.body || "{}");

    try {
      const newMuscleGroup = await MuscleGroupService.addMuscleGroup(muscleGroup);
      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify({
          message: "Muscle group added successfully!",
          data: newMuscleGroup,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: "An error occurred while adding the muscle group.",
          error: error.message,
        }),
      };
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
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Muscle group updated successfully!",
          data: updatedMuscleGroup,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "An error occurred while updating the muscle group.",
          error: error.message,
        }),
      };
    }
  }

  static async deleteMuscleGroup(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedMuscleGroup = await MuscleGroupService.deleteMuscleGroup(id || "");
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Muscle group deleted successfully!",
          data: deletedMuscleGroup,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "An error occurred while deleting the muscle group.",
          error: error.message,
        }),
      };
    }
  }
}
