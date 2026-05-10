import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { DietPlanController } from "../../controllers/dietPlanController";
import { validateDietPlan } from "../../middleware/dietPlanMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/dietPlans";

const dietPlanController = new DietPlanController();

const dietPlanApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: dietPlanController.getAll,
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: dietPlanController.getDietPlanById,
    access: "public",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: dietPlanController.getDietPlanByUserId,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: dietPlanController.updateDietPlan,
    access: "trainerOrAdmin",
    middlewares: [validateDietPlan],
  },
  [`PUT ${BASE_PATH}/one/user`]: {
    handler: dietPlanController.updateDietPlanByUserId,
    access: "trainerOrAdmin",
    middlewares: [validateDietPlan],
  },
  [`POST ${BASE_PATH}`]: {
    handler: dietPlanController.addDietPlan,
    access: "trainerOrAdmin",
    middlewares: [validateDietPlan],
  },
  [`DELETE ${BASE_PATH}/one/user`]: {
    handler: dietPlanController.deleteDietPlanByUserId,
    access: "trainerOrAdmin",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: dietPlanController.deleteById,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, dietPlanApiRoutes);
};
