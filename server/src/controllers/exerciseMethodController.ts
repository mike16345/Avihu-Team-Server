import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import ExerciseMethodService from "../services/exerciseMethodService";
import BaseController from "./BaseController";
import { IExerciseMethod } from "../interfaces/IWorkoutPlan";

export default class ExerciseMethodController extends BaseController<IExerciseMethod> {
  constructor() {
    super(new ExerciseMethodService());
  }

  create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return super.create(event);
  }

  getAll(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return super.getAll(event);
  }

  getOne(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return this.getOne(event);
  }

  getById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return super.getById(event);
  }

  updateById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return super.updateById(event);
  }

  deleteById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return super.deleteById(event);
  }
}
