import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanService } from "../services/dietPlanService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent, removeNestedIds } from "../utils/utils";
import { calculateTotalCalories } from "../utils/dietPlan";
import BaseController from "./BaseController";
import { IDietPlan } from "../interfaces/IDietPlan";

export class DietPlanController extends BaseController<IDietPlan, DietPlanService> {
  constructor() {
    super(new DietPlanService());
  }

  addDietPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, data } = this.getParamsOrError(event, ["data"], "body");

    if (error) return error;

    try {
      data.totalCalories = calculateTotalCalories(data.meals, data.fatsPerDay);

      const dietPlanResult = await this.service.create(data);

      return this.successResponse({
        status: StatusCode.CREATED,
        data: dietPlanResult,
        message: "Successfully added diet plan!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateDietPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);
    const body = extractBodyFromEvent(event);

    if (error) return error;

    const newDietPlan = removeNestedIds(body);

    newDietPlan.totalCalories = calculateTotalCalories(newDietPlan.meals, newDietPlan.fatsPerDay);

    try {
      const updatedDietPlan = await this.service.updateById(id, newDietPlan);

      return this.successResponse({
        status: StatusCode.OK,
        data: updatedDietPlan,
        message: "Successfully updated diet plan!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateDietPlanByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);
    const body = extractBodyFromEvent(event);

    if (error) return error;

    const newDietPlan = removeNestedIds(body);

    try {
      const updatedDietPlan = await this.service.updateOne({ userId: id }, newDietPlan);

      return this.successResponse({
        status: StatusCode.OK,
        data: updatedDietPlan,
        message: "Successfully updated diet plan by user ID!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  deleteDietPlanByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);

    if (error) return error;

    try {
      const response = await this.service.delete({ userId: id });

      return this.successResponse({
        status: StatusCode.OK,
        data: response,
        message: "Successfully deleted diet plan by user ID!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getDietPlanById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);
    const populate = event.queryStringParameters?.populate;

    if (error) return error;

    try {
      const dietPlan = await this.service.getDietPlanById(id, populate === "true");

      return this.successResponse({
        status: StatusCode.OK,
        data: dietPlan,
        message: "Successfully retrieved diet plan!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getDietPlanByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const populate = event.queryStringParameters?.populate;
    const { userId, error } = this.getParamsOrError(event, ["userId"]);

    if (error) return error;

    try {
      const dietPlan = await this.service.getDietPlanByUserId(userId, populate === "true");

      return this.successResponse({
        status: StatusCode.OK,
        data: dietPlan,
        message: "Successfully retrieved diet plan by user ID!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
