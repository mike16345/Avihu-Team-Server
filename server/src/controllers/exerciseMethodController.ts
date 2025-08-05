import ExerciseMethodService from "../services/exerciseMethodService";
import BaseController from "./BaseController";
import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { APIGatewayProxyEvent } from "aws-lambda";

export default class ExerciseMethodController extends BaseController<
  IExerciseMethod,
  ExerciseMethodService
> {
  constructor() {
    super(new ExerciseMethodService());
  }

  getOne = async (event: APIGatewayProxyEvent) => {
    try {
      const { error, name } = this.getParamsOrError(event, ["name"]);
      if (error) return error;

      const result = await this.service.findOne({ title: name });

      return this.successResponse({ data: result });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
