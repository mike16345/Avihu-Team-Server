import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WorkoutPlanController from "../../controllers/workoutPlanController";
import { handleApiCall } from "../baseHandler";
import { validateWorkoutPlan } from "../../middleware/workoutPlanMiddleware";

const BASE_PATH = "/workoutPlans";

const workoutPlanController = new WorkoutPlanController();

const workoutPlanApiHandlers = {
  [`GET ${BASE_PATH}`]: workoutPlanController.getAll,
  [`GET ${BASE_PATH}/one`]: workoutPlanController.getById,
  [`GET ${BASE_PATH}/user`]: workoutPlanController.getOne,
  [`PUT ${BASE_PATH}/one`]: workoutPlanController.updateById,
  [`PUT ${BASE_PATH}/one/user`]: workoutPlanController.update,
  [`POST ${BASE_PATH}`]: workoutPlanController.addWorkoutPlan,
  [`DELETE ${BASE_PATH}/one`]: workoutPlanController.deleteById,
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
  return await handleApiCall(event, context, workoutPlanApiHandlers, workoutPlanMiddleware);
};
