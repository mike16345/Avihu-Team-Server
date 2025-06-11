import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import ExerciseMethodService from "../services/exerciseMethodService";
import BaseController from "./BaseController";
import { IExerciseMethod } from "../interfaces/IWorkoutPlan";

export default class ExerciseMethodController extends BaseController<IExerciseMethod> {
  constructor() {
    super(new ExerciseMethodService());
    
  }

  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return await  super.create(event);
  }

 async getAll(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return await super.getAll(event);
  }

  async getOne(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return await this.getOne(event);
  }

  async getById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return await super.getById(event);
  }

  async updateById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return await super.updateById(event);
  }

  async deleteById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return await super.deleteById(event);
  }
}
