import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RecordedSetsService } from "../services/recordedSetsService";
import { StatusCode } from "../enums/StatusCode";
import mongoose from "mongoose";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

class RecordedSetsController {
  static async addRecordedSet(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const sessionId = event.queryStringParameters?.sessionId;
    const { userId, muscleGroup, exercise, recordedSet } = JSON.parse(event.body || "{}");

    try {
      const response = await RecordedSetsService.addRecordedSet(
        userId,
        muscleGroup,
        exercise,
        sessionId || "",
        recordedSet
      );

      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify(response),
      };
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getRecordedSetsByUserId(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const userId = event.queryStringParameters?.userId;
    const query = { ...event.queryStringParameters };

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "userId query parameter is required.");
    }

    try {
      const objectId = new mongoose.mongo.ObjectId(userId);
      query.userId = objectId;

      const response = await RecordedSetsService.getRecordedSetsByUserId(query);

      if (typeof response === "string") {
        return createResponse(StatusCode.BAD_REQUEST, response);
      }

      return createResponseWithData(
        StatusCode.OK,
        response,
        "Successfully retrieved recorded sets"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getUserRecordedExerciseNamesByMuscleGroup(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const userId = event.queryStringParameters?.userId;
    const muscleGroup = event.queryStringParameters?.muscleGroup;

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "userId query parameter is required.");
    }

    if (!muscleGroup) {
      return createResponse(StatusCode.BAD_REQUEST, "muscleGroup query parameter is required.");
    }

    try {
      const query = { ...event.queryStringParameters, userId: new mongoose.mongo.ObjectId(userId) };
      const response = await RecordedSetsService.getUserRecordedExerciseNamesByMuscleGroup(query);

      if (typeof response === "string") {
        return createResponse(StatusCode.NOT_FOUND, response);
      }

      return createResponseWithData(
        StatusCode.OK,
        response,
        "Successfully retrieved exercise names"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getUserRecordedMuscleGroupNames(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "userId query parameter is required.");
    }

    try {
      const query = { ...event.queryStringParameters, userId: new mongoose.mongo.ObjectId(userId) };
      const response = await RecordedSetsService.getUserRecordedMuscleGroupNames(query);

      if (typeof response === "string") {
        return createResponse(StatusCode.NOT_FOUND, response);
      }

      return createResponseWithData(
        StatusCode.OK,
        response,
        "Successfully retrieved  user record muscle group names"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}

export default RecordedSetsController;
