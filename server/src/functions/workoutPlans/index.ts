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
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: workoutPlanController.getById,
    access: "public",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: workoutPlanController.getOne,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: workoutPlanController.updateById,
    access: "trainerOrAdmin",
    middlewares: [validateWorkoutPlan],
  },
  [`PUT ${BASE_PATH}/one/user`]: {
    handler: workoutPlanController.update,
    access: "trainerOrAdmin",
    middlewares: [validateWorkoutPlan],
  },
  [`POST ${BASE_PATH}`]: {
    handler: workoutPlanController.addWorkoutPlan,
    access: "trainerOrAdmin",
    middlewares: [validateWorkoutPlan],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: workoutPlanController.deleteById,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, workoutPlanApiRoutes);
};
