import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanService } from "../services/dietPlanService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import { calculateTotalCalories } from "../utils/dietPlan";
import BaseController from "./BaseController";
import { IDietPlan } from "../interfaces/IDietPlan";

export class DietPlanController extends BaseController<IDietPlan, DietPlanService> {
  constructor() {
    super(new DietPlanService());
  }

  addDietPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const data = extractBodyFromEvent(event);

    try {
      const dietPlanResult = await this.service.saveActivePlan(data);

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

    try {
      const currentPlan = await this.service.getDietPlanById(id, false);

      if (!currentPlan) {
        return this.errorResponse({
          status: StatusCode.NOT_FOUND,
          message: "Diet plan not found for the given ID.",
        });
      }

      const updatedDietPlan = await this.service.saveActivePlan({
        ...body,
        userId: currentPlan.userId,
      });

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

    try {
      const updatedDietPlan = await this.service.saveActivePlan({ ...body, userId: id });

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
      const response = await this.service.deleteActiveByUserId(id);

      return this.successResponse({
        status: StatusCode.OK,
        data: response,
        message: "Successfully deleted diet plan by user ID!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  deleteDietPlanById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);

    if (error) return error;

    try {
      const response = await this.service.deleteActiveById(id);

      return this.successResponse({
        status: StatusCode.OK,
        data: response,
        message: "Successfully deleted diet plan!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  private repairLegacyCaloriesIfNeeded = async (dietPlan: any) => {
    if (dietPlan.version === 2) return dietPlan;

    const computed = calculateTotalCalories(dietPlan.meals, dietPlan.freeCalories);
    const current = Number.isFinite(+dietPlan.totalCalories)
      ? +dietPlan.totalCalories
      : undefined;

    if (current !== computed) {
      try {
        await this.service.repairLegacyTotalCalories(dietPlan._id.toString(), computed);
        dietPlan.totalCalories = computed;
      } catch (fixErr) {
        console.warn("Auto-fix totalCalories failed:", fixErr);
      }
    }

    return dietPlan;
  };

  getDietPlanById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);
    const populate = event.queryStringParameters?.populate;

    if (error) return error;

    try {
      const dietPlan = await this.service.getDietPlanById(id, populate === "true");

      if (!dietPlan) {
        return this.errorResponse({
          status: StatusCode.NOT_FOUND,
          message: "Diet plan not found for the given ID.",
        });
      }

      await this.repairLegacyCaloriesIfNeeded(dietPlan);

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
      if (!dietPlan) {
        return this.errorResponse({
          status: StatusCode.NOT_FOUND,
          message: "Diet plan not found for the given user ID.",
        });
      }

      await this.repairLegacyCaloriesIfNeeded(dietPlan);

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
