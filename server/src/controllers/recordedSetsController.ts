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

  async addRecordedSet(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const sessionId = event.queryStringParameters?.sessionId;
    const { userId, muscleGroup, exercise, recordedSet } = JSON.parse(event.body || "{}");

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
      return createServerErrorResponse(err);
    }
  }

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

      return createResponseWithData(
        StatusCode.OK,
        response,
        "Successfully retrieved recorded sets"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };
}

export default RecordedSetsController;
