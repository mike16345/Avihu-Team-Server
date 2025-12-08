import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RecordedSetsService } from "../services/recordedSetsService";
import { StatusCode } from "../enums/StatusCode";
import mongoose from "mongoose";
import { createResponse, extractQueryFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import { IMuscleGroupRecordedSets } from "../interfaces/ISet";

class RecordedSetsController extends BaseController<IMuscleGroupRecordedSets, RecordedSetsService> {
  constructor() {
    super(new RecordedSetsService());
  }

  addRecordedSet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { sessionId } = extractQueryFromEvent(event);
    const { error, userId, muscleGroup, exercise, recordedSets } = this.getParamsOrError(
      event,
      ["userId", "muscleGroup", "exercise", "recordedSets"],
      "body"
    );

    if (error) return error;
    const sets = Array.isArray(recordedSets) ? recordedSets : [recordedSets];

    try {
      const response = await this.service.addRecordedSets(
        userId,
        muscleGroup,
        exercise,
        sessionId,
        sets
      );

      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify(response),
      };
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateRecordedSetById = async (event: APIGatewayProxyEvent) => {
    const { error, userId, set, setId, exercise } = this.getParamsOrError(
      event,
      ["userId", "exercise", "set", "setId"],
      "body"
    );

    if (error) return error;

    try {
      const result = await this.service.updateRecordedSetById(setId, userId, exercise, set);

      if (result.modifiedCount == 0) {
        return this.errorResponse("לא הצלחנו לעדכן את הסט", StatusCode.NOT_MODIFIED);
      }

      return this.successResponse({ message: "סט עודכן בהצלחה!", status: StatusCode.CREATED });
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  deleteRecordedSetById = async (event: APIGatewayProxyEvent) => {
    const { error, userId, setId, exercise } = this.getParamsOrError(
      event,
      ["userId", "exercise", "setId"],
      "body"
    );

    if (error) return error;

    try {
      const result = await this.service.deleteRecordedSetById(setId, userId, exercise);
      if (result.modifiedCount == 0) {
        return this.errorResponse("לא הצלחנו למחוק את הסט", StatusCode.NOT_MODIFIED);
      }

      return this.successResponse({ message: "סט נמחק בהצלחה!", status: StatusCode.OK });
    } catch (e: any) {
      return this.errorResponse(e);
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
