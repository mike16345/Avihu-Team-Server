import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";
import { ExerciseMethodService } from "../services/exerciseMethodService";

export default class ExerciseMethodController {
  static async getAllExerciseMethods(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allExerciseMethods = await ExerciseMethodService.getAllExerciseMethods();

      if (!allExerciseMethods) {
        return createResponse(StatusCode.NOT_FOUND, "Could not find any exercise methods!");
      }

      return createResponseWithData(
        StatusCode.OK,
        allExerciseMethods,
        "Exercise methods retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getExerciseMethodById(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const exerciseMethod = await ExerciseMethodService.getexErciseMethodById(id || "");

      if (!exerciseMethod) {
        return createResponse(StatusCode.NOT_FOUND, "Exercise method not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        exerciseMethod,
        "Exercise method retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
  static async getExerciseMethodByName(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { name } = event.queryStringParameters || {};

    try {
      const exerciseMethod = await ExerciseMethodService.getExerciseMethodByName(name || "");

      if (!exerciseMethod) {
        return createResponse(StatusCode.NOT_FOUND, `לא נמצאה שיטת אימון בשם ${name}`);
      }

      return createResponseWithData(
        StatusCode.OK,
        exerciseMethod,
        "Exercise method retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async addManyExerciseMethod(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const exerciseMethods = JSON.parse(event.body || "{}");

    try {
      const newExerciseMethods = await ExerciseMethodService.addManyExerciseMethods(
        exerciseMethods
      );

      if (!newExerciseMethods) {
        return createResponse(StatusCode.BAD_REQUEST, "לא הצלחנו ליצור את שיטות האימון!");
      }

      return createResponseWithData(
        StatusCode.CREATED,
        newExerciseMethods,
        "Exercise method added successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
  static async addExerciseMethod(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const exerciseMethod = JSON.parse(event.body || "{}");

    try {
      const newExerciseMethod = await ExerciseMethodService.addExerciseMethod(exerciseMethod);

      if (!newExerciseMethod) {
        return createResponse(StatusCode.BAD_REQUEST, "לא הצלחנו ליצור את שיטת האימון!");
      }

      return createResponseWithData(
        StatusCode.CREATED,
        newExerciseMethod,
        "Exercise method added successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async editExerciseMethod(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const exerciseMethod = JSON.parse(event.body || "{}");
    const { id } = event.queryStringParameters || {};

    try {
      const updatedExerciseMethod = await ExerciseMethodService.editExerciseMethod(
        exerciseMethod,
        id || ""
      );

      if (!updatedExerciseMethod) {
        return createResponse(StatusCode.NOT_FOUND, "שיטת אימון לא נמצאה ");
      }

      return createResponseWithData(
        StatusCode.OK,
        updatedExerciseMethod,
        "Muscle group updated successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async deleteExerciseMethod(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedExerciseMethod = await ExerciseMethodService.deleteExerciseMethod(id || "");

      if (!deletedExerciseMethod) {
        return createResponse(StatusCode.NOT_FOUND, "שיטת אימון לא נמצאה ");
      }

      return createResponseWithData(
        StatusCode.OK,
        deletedExerciseMethod,
        "Exercise method deleted successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
}
