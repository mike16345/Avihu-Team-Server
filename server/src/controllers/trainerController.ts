import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ITrainer } from "../interfaces/ITrainer";
import BaseController from "./BaseController";
import TrainerService from "../services/trainerService";
import { extractBodyFromEvent, extractPaginationParamsFromEvent, extractQueryFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export default class TrainerController extends BaseController<ITrainer, TrainerService> {
  constructor() {
    super(new TrainerService());
  }

  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const payload = extractBodyFromEvent(event);
      const trainer = await this.service.createTrainer(payload);
      const response = this.successResponse({
        status: StatusCode.CREATED,
        data: trainer,
        message: "Trainer created successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getAll = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const data = await this.service.findWithCounts(query);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Trainers retrieved successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getPaginated = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractPaginationParamsFromEvent(event);
      const data = await this.service.findPaginatedWithCounts(query);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Trainers retrieved successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getOne = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const data = await this.service.getTrainerWithOverview(id);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Trainer retrieved successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const payload = extractBodyFromEvent(event);
      const trainer = await this.service.updateTrainer(id, payload);
      const response = this.successResponse({
        status: StatusCode.OK,
        data: trainer,
        message: "Trainer updated successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  delete = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const trainer = await this.service.deleteTrainer(id);
      const response = this.successResponse({
        status: StatusCode.OK,
        data: trainer,
        message: "Trainer deleted successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };
}
