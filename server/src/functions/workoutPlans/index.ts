import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WorkoutPlanController from "../../controllers/workoutPlanController";
import { handleApiCall } from "../baseHandler";
import { validateWorkoutPlan } from "../../middleware/workoutPlanMiddleware";

const BASE_PATH = "/workoutPlans";

const workoutPlanApiHandlers = {
  [`GET ${BASE_PATH}`]: WorkoutPlanController.getAllWorkoutPlans, // Get weigh ins by ID
  [`GET ${BASE_PATH}/one`]: WorkoutPlanController.getWorkoutPlanById, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user`]: WorkoutPlanController.getWorkoutPlanByUserId, // Get user by ID
  [`PUT ${BASE_PATH}/one`]: WorkoutPlanController.updateWorkoutPlan, // Update user by ID
  [`PUT ${BASE_PATH}/one/user`]: WorkoutPlanController.updateWorkoutPlan, // Update user by ID
  [`POST ${BASE_PATH}`]: WorkoutPlanController.addWorkoutPlan, // Add new user
  [`DELETE ${BASE_PATH}/one`]: WorkoutPlanController.deleteWorkoutPlan, // Delete user by ID
};

const workoutPlanMiddleware = {
  [`POST ${BASE_PATH}`]: validateWorkoutPlan,
  [`PUT ${BASE_PATH}/one`]: validateWorkoutPlan,
  [`PUT ${BASE_PATH}/one/user`]: validateWorkoutPlan,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, workoutPlanApiHandlers);
};
