import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import DietPlanController from "../../controllers/dietPlanController";

const BASE_PATH = "/dietPlans";
const dietPlanApiHandlers = {
  [`GET ${BASE_PATH}`]: DietPlanController.getDietPlans,
  [`GET ${BASE_PATH}/one`]: DietPlanController.getDietPlanById, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user`]: DietPlanController.getDietPlanByUserId, // Get user by ID
  [`PUT ${BASE_PATH}/one`]: DietPlanController.updateDietPlan, // Update user by ID
  [`PUT ${BASE_PATH}/one/user`]: DietPlanController.updateDietPlanByUserId, // Update user by ID
  [`POST ${BASE_PATH}`]: DietPlanController.addDietPlan, // Add new user
  [`DELETE ${BASE_PATH}/one/user`]: DietPlanController.deleteDietPlanByUserId, // Delete user by ID
  [`DELETE ${BASE_PATH}/one`]: DietPlanController.deleteDietPlan, // Delete user by ID
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, dietPlanApiHandlers);
};
