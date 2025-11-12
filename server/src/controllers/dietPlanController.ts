import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanService } from "../services/dietPlanService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent, removeNestedIds, removeNestedIdsSafe } from "../utils/utils";
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
      const totalCalories = calculateTotalCalories(data.meals, data.freeCalories);

      console.log("total calories", totalCalories);

      const dietPlanResult = await this.service.create({ ...data, totalCalories: totalCalories });

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
    const totalCalories = calculateTotalCalories(newDietPlan.meals, newDietPlan.freeCalories);

    console.log("total calories", totalCalories);

    try {
      const updatedDietPlan = await this.service.updateById(id, {
        ...newDietPlan,
        totalCalories: totalCalories,
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

    const newDietPlan = removeNestedIds(body);
    const totalCalories = calculateTotalCalories(newDietPlan.meals, newDietPlan.freeCalories);

    console.log("total calories", totalCalories);
    try {
      const updatedDietPlan = await this.service.updateOne(
        { userId: id },
        { ...newDietPlan, totalCalories }
      );

      if (!updatedDietPlan) {
        return this.errorResponse({
          status: StatusCode.NOT_FOUND,
          message: "Diet plan not found for the given user ID.",
        });
      }

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

      if (!dietPlan) {
        return this.errorResponse({
          status: StatusCode.NOT_FOUND,
          message: "Diet plan not found for the given ID.",
        });
      }

      const computed = calculateTotalCalories(dietPlan.meals, dietPlan.freeCalories);
      const current = Number.isFinite(+dietPlan.totalCalories)
        ? +dietPlan.totalCalories
        : undefined;

      if (current !== computed) {
        try {
          const id = dietPlan._id;
          const cleaned = removeNestedIdsSafe(dietPlan);
          await this.service.updateById?.(id, { ...cleaned, totalCalories: computed });

          (dietPlan as any).totalCalories = computed;
        } catch (fixErr) {
          console.warn("Auto-fix totalCalories failed:", fixErr);
        }
      }

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

      const computed = calculateTotalCalories(dietPlan.meals, dietPlan.freeCalories);
      const current = Number.isFinite(+dietPlan.totalCalories)
        ? +dietPlan.totalCalories
        : undefined;

      if (current !== computed) {
        try {
          const id = dietPlan._id;
          const cleaned = removeNestedIdsSafe(dietPlan);
          (dietPlan as any).totalCalories = computed;
          const result = await this.service.updateById?.(id, {
            ...cleaned,
            totalCalories: computed,
          });
          console.log("Auto-fix result:", result);
          (dietPlan as any).totalCalories = computed;
        } catch (fixErr) {
          console.warn("Auto-fix totalCalories failed:", fixErr);
        }
      }

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
