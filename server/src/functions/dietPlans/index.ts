import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { DietPlanController } from "../../controllers/dietPlanController";
import { validateDietPlan } from "../../middleware/dietPlanMiddleware";

const BASE_PATH = "/dietPlans";

const dietPlanController = new DietPlanController();

const dietPlanApiHandlers = {
  [`GET ${BASE_PATH}`]: dietPlanController.getAll,
  [`GET ${BASE_PATH}/one`]: dietPlanController.getDietPlanById,
  [`GET ${BASE_PATH}/user`]: dietPlanController.getDietPlanByUserId,
  [`PUT ${BASE_PATH}/one`]: dietPlanController.updateDietPlan,
  [`PUT ${BASE_PATH}/one/user`]: dietPlanController.updateDietPlanByUserId,
  [`POST ${BASE_PATH}`]: dietPlanController.addDietPlan,
  [`DELETE ${BASE_PATH}/one/user`]: dietPlanController.deleteDietPlanByUserId,
  [`DELETE ${BASE_PATH}/one`]: dietPlanController.deleteById,
};

const dietPlanMiddlewares = {
  [`POST ${BASE_PATH}`]: validateDietPlan,
  [`PUT ${BASE_PATH}/one`]: validateDietPlan,
  [`PUT ${BASE_PATH}/one/user`]: validateDietPlan,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, dietPlanApiHandlers, dietPlanMiddlewares);
};
