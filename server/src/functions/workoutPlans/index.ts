import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WorkoutPlanController from "../../controllers/workoutPlanController";
import { handleApiCall } from "../baseHandler";
import { validateWorkoutPlan } from "../../middleware/workoutPlanMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/workoutPlans";

const workoutPlanController = new WorkoutPlanController();

const workoutPlanApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: workoutPlanController.getAll,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: workoutPlanController.getById,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: workoutPlanController.getOne,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: workoutPlanController.updateById,
    access: "subtrainer",
    middlewares: [validateWorkoutPlan],
  },
  [`PUT ${BASE_PATH}/one/user`]: {
    handler: workoutPlanController.update,
    access: "subtrainer",
    middlewares: [validateWorkoutPlan],
  },
  [`POST ${BASE_PATH}`]: {
    handler: workoutPlanController.addWorkoutPlan,
    access: "subtrainer",
    middlewares: [validateWorkoutPlan],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: workoutPlanController.deleteById,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, workoutPlanApiRoutes);
};
