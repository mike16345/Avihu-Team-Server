import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import MuscleGroupController from "../../controllers/muscleGroupController";
import { checkIfMuscleGroupExists } from "../../middleware/muscleGroupMiddleWare";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/muscleGroups";

const muscleGroupController = new MuscleGroupController();

const muscleGroupApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: muscleGroupController.getAll,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: muscleGroupController.getById,
    access: "subtrainer",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: muscleGroupController.updateById,
    access: "subtrainer",
  },
  [`POST ${BASE_PATH}`]: {
    handler: muscleGroupController.create,
    access: "subtrainer",
    middlewares: [checkIfMuscleGroupExists],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: muscleGroupController.deleteById,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, muscleGroupApiRoutes);
};
