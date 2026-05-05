import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import BaseController from "./BaseController";
import { ISubTrainer } from "../interfaces/ISubTrainer";
import SubTrainerService from "../services/subTrainerService";
import { extractBodyFromEvent, extractPaginationParamsFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export default class SubTrainerController extends BaseController<
  ISubTrainer,
  SubTrainerService
> {
  constructor() {
    super(new SubTrainerService());
  }

  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const payload = extractBodyFromEvent(event);
      const subTrainer = await this.service.createSubTrainer(payload);
      const response = this.successResponse({
        status: StatusCode.CREATED,
        data: subTrainer,
        message: "Sub trainer created successfully!",
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

      const data = await this.service.getSubTrainerWithOverview(id);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Sub trainer retrieved successfully!",
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
      const data = await this.service.findPaginatedWithTraineeCounts(query);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Sub trainers retrieved successfully!",
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
      const subTrainer = await this.service.updateSubTrainer(id, payload);
      const response = this.successResponse({
        status: StatusCode.OK,
        data: subTrainer,
        message: "Sub trainer updated successfully!",
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

      const subTrainer = await this.service.deleteSubTrainer(id);
      const response = this.successResponse({
        status: StatusCode.OK,
        data: subTrainer,
        message: "Sub trainer deleted successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };
}
