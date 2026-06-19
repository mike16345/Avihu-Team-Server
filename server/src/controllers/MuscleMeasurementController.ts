import BaseController from "./BaseController";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { IUserMuscleMeasurements } from "../interfaces/IMuscleMeasurment";
import { MuscleMeasurementService } from "../services/muscleMeasurementService";

export default class MuscleMeasurementController extends BaseController<
  IUserMuscleMeasurements,
  MuscleMeasurementService
> {
  constructor() {
    super(new MuscleMeasurementService());
  }

  getMeasurementsByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId } = this.getParamsOrError(event, ["userId"]);

    if (error) return error;

    try {
      const response = await this.service.getUsersMuscleMeasurements(userId);

      return this.successResponse({
        data: response,
        message: "Successfully retrieved measurements",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  removeMeasurement = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, date, muscle } = this.getParamsOrError(
      event,
      ["userId", "date", "muscle"],
      "body"
    );

    if (error) return error;

    try {
      const response = await this.service.removeMeasurement(userId, date, muscle);

      return this.successResponse({
        data: response,
        message: "Successfully deleted measurement",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  removeMeasurementRowById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);

    if (error) return error;

    try {
      const response = await this.service.removeMeasurementRowById(id);

      return this.successResponse({
        data: response,
        message: "מדידה נמחקה בהצלחה",
        status: StatusCode.OK,
      });
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  saveMeasurement = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, date, measurement, muscle } = this.getParamsOrError(
      event,
      ["userId", "date", "measurement", "muscle"],
      "body"
    );

    if (error) return error;

    try {
      const response = await this.service.saveMeasurment(userId, date, +measurement, muscle);

      return this.successResponse({
        data: response,
        message: "Successfully saved measurement",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
