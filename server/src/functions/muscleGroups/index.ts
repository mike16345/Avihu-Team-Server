import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import MuscleGroupController from "../../controllers/muscleGroupController";
import { checkIfMuscleGroupExists } from "../../middleware/muscleGroupMiddleWare";

const BASE_PATH = "/muscleGroups";

const muscleGroupController=new MuscleGroupController()

const muscleGroupApiHandlers = {
  [`GET ${BASE_PATH}`]: muscleGroupController.getAll,
  [`GET ${BASE_PATH}/one`]: muscleGroupController.getById,
  [`PUT ${BASE_PATH}/one`]: muscleGroupController.updateById,
  [`POST ${BASE_PATH}`]: muscleGroupController.create,
  [`DELETE ${BASE_PATH}/one`]: muscleGroupController.deleteById,
};
const muscleGroupValidators = {
  [`POST ${BASE_PATH}`]: checkIfMuscleGroupExists,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, muscleGroupApiHandlers, muscleGroupValidators);
};
