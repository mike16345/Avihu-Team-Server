import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { workoutPlanService } from "../services/workoutPlanService";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

class WorkoutPlanController {
  static addWorkoutPlan = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = event?.queryStringParameters?.id;
    const workoutPlan = { ...JSON.parse(event.body || "{}"), userId: userId };

    if (!workoutPlan) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan data is required.");
    }

    try {
      const workoutPlanResult = await workoutPlanService.addWorkoutPlan(workoutPlan);

      return createResponseWithData(
        StatusCode.CREATED,
        workoutPlanResult,
        "Successfully added workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static updateWorkoutPlan = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const workoutPlanId = event.queryStringParameters?.id || "";
    const newWorkoutPlan = JSON.parse(event.body || "{}");

    if (!workoutPlanId) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan ID is required.");
    }

    try {
      const updatedWorkoutPlan = await workoutPlanService.updateWorkoutPlan(
        workoutPlanId,
        newWorkoutPlan
      );

      if (!updatedWorkoutPlan) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        updatedWorkoutPlan,
        "Successfully updated workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static updateWorkoutPlanByUserId = async (event: APIGatewayProxyEvent) => {
    const userId = String(event.queryStringParameters?.userId) || "";
    const updatedData = JSON.parse(event.body || "{}");

    try {
      const updatedWorkoutPlan = await workoutPlanService.updateWorkoutPlanByUserId(
        userId,
        updatedData
      );

      if (!updatedWorkoutPlan) {
        return createResponse(
          StatusCode.NOT_FOUND,
          "There was an error updating the workout plan."
        );
      }

      console.log("returning response");
      return createResponseWithData(
        StatusCode.OK,
        updatedWorkoutPlan,
        "Successfully updated workout plan!"
      );
    } catch (err) {
      return createServerErrorResponse(err);
    }
  };

  static deleteWorkoutPlan = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan ID is required.");
    }

    try {
      const response = await workoutPlanService.deleteWorkoutPlanById(id);

      if (!response) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan not found!");
      }

      return createResponseWithData(StatusCode.OK, response, "Successfully deleted workout plan!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getAllWorkoutPlans = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      const workoutPlans = await workoutPlanService.getAllWorkoutPlans();

      if (!workoutPlans) {
        return createResponse(StatusCode.NOT_FOUND, "No workout plans found.");
      }

      return createResponseWithData(
        StatusCode.OK,
        workoutPlans,
        "Successfully retrieved all workout plans!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getWorkoutPlanById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const workoutPlanId = event.queryStringParameters?.id || "";

    if (!workoutPlanId) {
      return createResponse(StatusCode.BAD_REQUEST, "Workout plan ID is required.");
    }

    try {
      const workoutPlan = await workoutPlanService.getWorkoutPlanById(workoutPlanId);

      if (!workoutPlan) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        workoutPlan,
        "Successfully retrieved workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getWorkoutPlanByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const userId = event.queryStringParameters?.userId || "";

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "User ID is required.");
    }

    try {
      const workoutPlan = await workoutPlanService.getWorkoutPlanByUserId(userId);

      if (!workoutPlan) {
        return createResponse(StatusCode.NOT_FOUND, "Workout plan not found!");
      }

      return createResponseWithData(
        StatusCode.OK,
        workoutPlan,
        "Successfully retrieved workout plan!"
      );
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };
}

export default WorkoutPlanController;
