import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import RecordedSetsController from "../../controllers/recordedSetsController";
import { handleApiCall } from "../baseHandler";
import { validateRecordedSet } from "../../middleware/recordedSetMiddleware";

const BASE_PATH = "/recordedSets";

const recordedSetsApiHandlers = {
  [`POST ${BASE_PATH}`]: RecordedSetsController.addRecordedSet, // Add new user
  [`GET ${BASE_PATH}/user`]: RecordedSetsController.getRecordedSetsByUserId, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user/names`]: RecordedSetsController.getUserRecordedExerciseNamesByMuscleGroup, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user/names/muscleGroups`]:
    RecordedSetsController.getUserRecordedMuscleGroupNames, // Get weigh ins by ID
};

const recordedSetsMiddleware = {
  [`POST ${BASE_PATH}`]: validateRecordedSet,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, recordedSetsApiHandlers, recordedSetsMiddleware);
};
