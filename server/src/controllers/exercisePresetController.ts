import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ExercisePresetService } from "../services/exercisePresetService";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

export class ExercisePresetController {
  static async addExercise(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const exercise = JSON.parse(event.body || "{}");

    try {
      const newExercise = await ExercisePresetService.addExercise(exercise);
      return createResponseWithData(
        StatusCode.CREATED,
        newExercise,
        "Exercise added successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getExercises(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allExercises = await ExercisePresetService.getExercises();

      if (!allExercises || allExercises.length === 0) {
        return createResponse(StatusCode.NOT_FOUND, "No exercises found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        allExercises,
        "Exercises retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getExercisesByMuscleGroup(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { muscleGroup } = event.queryStringParameters || {};

    try {
      const muscleGroupExercises = await ExercisePresetService.getExercisesByMuscleGroup(
        muscleGroup || ""
      );

      if (!muscleGroupExercises || muscleGroupExercises.length === 0) {
        return createResponse(
          StatusCode.NOT_FOUND,
          `No exercises found for muscle group: ${muscleGroup}`
        );
      }

      return createResponseWithData(
        StatusCode.OK,
        muscleGroupExercises,
        "Exercises by muscle group retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getExerciseById(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const exercise = await ExercisePresetService.getExerciseById(id || "");

      if (!exercise) {
        return createResponse(StatusCode.NOT_FOUND, `Exercise not found with ID: ${id}`);
      }

      return createResponseWithData(StatusCode.OK, exercise, "Exercise retrieved successfully!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async deleteExercise(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedExercise = await ExercisePresetService.deleteExercise(id || "");

      if (!deletedExercise) {
        return createResponse(
          StatusCode.NOT_FOUND,
          `Could not find exercise with ID: ${id} to delete!`
        );
      }

      return createResponseWithData(
        StatusCode.OK,
        deletedExercise,
        "Exercise deleted successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async updateExercise(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const newExercise = JSON.parse(event.body || "{}");
    const { id } = event.queryStringParameters || {};

    try {
      const updatedExercise = await ExercisePresetService.updateExercise(id || "", newExercise);

      if (!updatedExercise) {
        return createResponse(
          StatusCode.NOT_FOUND,
          `Could not find exercise with ID: ${id} to update!`
        );
      }

      return createResponseWithData(
        StatusCode.OK,
        updatedExercise,
        "Exercise updated successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
}
