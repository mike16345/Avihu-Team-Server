import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { DietPlanController } from "../../controllers/dietPlanController";
import { validateDietPlan } from "../../middleware/dietPlanMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/dietPlans";

const dietPlanController = new DietPlanController();

const dietPlanApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: dietPlanController.getTeamDietPlans,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: dietPlanController.getDietPlanById,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: dietPlanController.getDietPlanByUserId,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: dietPlanController.updateDietPlan,
    access: "subtrainer",
    middlewares: [validateDietPlan],
  },
  [`PUT ${BASE_PATH}/one/user`]: {
    handler: dietPlanController.updateDietPlanByUserId,
    access: "subtrainer",
    middlewares: [validateDietPlan],
  },
  [`POST ${BASE_PATH}`]: {
    handler: dietPlanController.addDietPlan,
    access: "subtrainer",
    middlewares: [validateDietPlan],
  },
  [`DELETE ${BASE_PATH}/one/user`]: {
    handler: dietPlanController.deleteDietPlanByUserId,
    access: "subtrainer",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: dietPlanController.deleteDietPlanById,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, dietPlanApiRoutes);
};
