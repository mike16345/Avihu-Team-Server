import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import MuscleGroupController from "../../controllers/muscleGroupController";
import { checkIfMuscleGroupExists } from "../../middleware/muscleGroupMiddleWare";

const BASE_PATH = "/muscleGroups";
const muscleGroupApiHandlers = {
  [`GET ${BASE_PATH}`]: MuscleGroupController.getAllMuscleGroups,
  [`GET ${BASE_PATH}/one`]: MuscleGroupController.getMuscleGroupById,
  [`PUT ${BASE_PATH}/one`]: MuscleGroupController.editMuscleGroup,
  [`POST ${BASE_PATH}`]: MuscleGroupController.addMuscleGroup,
  [`DELETE ${BASE_PATH}/one`]: MuscleGroupController.deleteMuscleGroup,
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
