import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DietPlanServices } from "../services/dietPlanService";
import { StatusCode } from "../enums/StatusCode";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  removeNestedIds,
} from "../utils/utils";

class DietPlanController {
  static addDietPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const dietPlan = JSON.parse(event.body || "{}");

    try {
      const dietPlanResult = await DietPlanServices.addDietPlan(dietPlan);

      return createResponseWithData(
        StatusCode.CREATED,
        dietPlanResult,
        "Successfully added diet plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static updateDietPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const dietPlanId = event.queryStringParameters?.id || "";
    const newDietPlan = removeNestedIds(JSON.parse(event.body || "{}"));

    try {
      const updatedDietPlan = await DietPlanServices.updateDietPlan(dietPlanId, newDietPlan);

      if (!updatedDietPlan) return createResponse(StatusCode.NOT_FOUND, "DietPlan not found!");

      return createResponseWithData(
        StatusCode.OK,
        updatedDietPlan,
        "Successfully updated diet plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static updateDietPlanByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const userId = event.queryStringParameters?.id || "";
    const newDietPlan = removeNestedIds(JSON.parse(event.body || "{}"));

    try {
      const updatedDietPlan = await DietPlanServices.updateDietPlanByUserId(userId, newDietPlan);
      if (!updatedDietPlan)
        return createResponse(
          StatusCode.NOT_FOUND,
          `DietPlan by given user id: "${userId}" not found!`
        );

      return createResponseWithData(
        StatusCode.OK,
        updatedDietPlan,
        "Successfully updated diet plan by user ID!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static deleteDietPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const dietPlanId = event.queryStringParameters?.id || "";

    try {
      const response = await DietPlanServices.deleteDietPlan(dietPlanId);

      if (typeof response === "string") {
        return createResponse(StatusCode.NOT_FOUND, response);
      }

      return createResponseWithData(StatusCode.OK, response, "Successfully deleted diet plan!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static deleteDietPlanByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const userId = event.queryStringParameters?.id || "";

    try {
      const response = await DietPlanServices.deleteDietPlanByUserId(userId);
      if (typeof response === "string") {
        return createResponse(StatusCode.NOT_FOUND, response);
      }

      return createResponseWithData(
        StatusCode.OK,
        response,
        "Successfully deleted diet plan by user ID!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getDietPlans = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const dietPlans = await DietPlanServices.getAllDietPlans();

      return createResponseWithData(StatusCode.OK, dietPlans, "Successfully retrieved diet plans!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getDietPlanById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const dietPlanId = event.queryStringParameters?.id || "";

    if (!dietPlanId) {
      return createResponse(
        StatusCode.BAD_REQUEST,
        "Diet Plan ID is required and should be a string."
      );
    }

    try {
      const dietPlan = await DietPlanServices.getDietPlanById(dietPlanId);

      if (!dietPlan) return createResponse(StatusCode.NOT_FOUND, "Diet Plan not found!");

      return createResponseWithData(StatusCode.OK, dietPlan, "Successfully retrieved diet plan!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getDietPlanByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const userId = event.queryStringParameters?.userId || "";

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "User ID is required and should be a string.");
    }

    try {
      const dietPlan = await DietPlanServices.getDietPlanByUserId(userId);

      if (!dietPlan)
        return createResponse(
          StatusCode.NOT_FOUND,
          `Diet Plan not found with user id "${userId}" !`
        );

      return createResponseWithData(
        StatusCode.OK,
        dietPlan,
        "Successfully retrieved diet plan by user ID!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };
}

export default DietPlanController;
