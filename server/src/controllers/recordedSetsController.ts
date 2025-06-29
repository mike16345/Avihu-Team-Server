import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RecordedSetsService } from "../services/recordedSetsService";
import { StatusCode } from "../enums/StatusCode";
import mongoose from "mongoose";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";
import BaseController from "./BaseController";
import { IMuscleGroupRecordedSets } from "../interfaces/ISet";

class RecordedSetsController extends BaseController<IMuscleGroupRecordedSets, RecordedSetsService> {
  constructor() {
    super(new RecordedSetsService());
  }

  addRecordedSet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const sessionId = event.queryStringParameters?.sessionId;
    const { error, userId, muscleGroup, exercise, recordedSet } = this.getParamsOrError(
      event,
      ["userId", "muscleGroup", "exercise", "recordedSet"],
      "body"
    );

    if (error) return error;

    try {
      const response = await this.service.addRecordedSet(
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
      return this.errorResponse(err);
    }
  };

  getUserRecordedSetsByExercise = async (event: APIGatewayProxyEvent) => {
    const { error, userId, muscleGroup, exercise } = this.getParamsOrError(event, [
      "userId",
      "muscleGroup",
      "exercise",
    ]);

    if (error) return this.errorResponse(error);

    try {
      const sets = await this.service.getUserRecordedSetsByExercise({
        userId,
        muscleGroup,
        exercise,
      });
      if (!sets) return this.errorResponse("No recorded sets found for the given parameters.");

      return this.successResponse({
        status: StatusCode.OK,
        data: sets,
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getRecordedSetsByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, ...query } = this.getParamsOrError(event, ["userId"]);

    if (error) return error;

    try {
      const objectId = new mongoose.mongo.ObjectId(userId);
      query.userId = objectId;

      const response = await this.service.getRecordedSetsByUserId(query);

      if (typeof response === "string") {
        return createResponse(StatusCode.BAD_REQUEST, response);
      }

      return this.successResponse({
        status: StatusCode.OK,
        data: response,
        message: "Successfully retrieved recorded sets",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}

export default RecordedSetsController;
