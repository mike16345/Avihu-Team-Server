import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import RecordedSetsController from "../../controllers/recordedSetsController";
import { handleApiCall } from "../baseHandler";
import { validateRecordedSet } from "../../middleware/recordedSetMiddleware";

const BASE_PATH = "/recordedSets";

const workoutPlanApiHandlers = {
  [`POST ${BASE_PATH}`]: RecordedSetsController.addRecordedSet, // Add new user
  [`GET ${BASE_PATH}/user`]: RecordedSetsController.getRecordedSetsByUserId, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user/names`]: RecordedSetsController.getUserRecordedExerciseNamesByMuscleGroup, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user/names/muscleGroups`]:
    RecordedSetsController.getUserRecordedMuscleGroupNames, // Get weigh ins by ID
};

const workoutPlanMiddlewares = {
  [`POST ${BASE_PATH}`]: validateRecordedSet,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, workoutPlanApiHandlers);
};
