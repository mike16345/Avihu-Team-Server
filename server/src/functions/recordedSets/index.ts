import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import RecordedSetsController from "../../controllers/recordedSetsController";
import { handleApiCall } from "../baseHandler";
import { validateRecordedSet } from "../../middleware/recordedSetMiddleware";

const BASE_PATH = "/recordedSets";

const recordedSetsController = new RecordedSetsController();
const recordedSetsApiHandlers = {
  [`POST ${BASE_PATH}`]: recordedSetsController.addRecordedSet,
  [`GET ${BASE_PATH}/user`]: recordedSetsController.getRecordedSetsByUserId,
  [`GET ${BASE_PATH}/user/exercise`]: recordedSetsController.getUserRecordedSetsByExercise,
  [`PUT ${BASE_PATH}/one`]: recordedSetsController.updateRecordedSetById,
  [`DELETE ${BASE_PATH}/one`]: recordedSetsController.deleteRecordedSetById,
};

const recordedSetsMiddleware = {
  [`POST ${BASE_PATH}`]: validateRecordedSet,
  [`PUT ${BASE_PATH}/one`]: validateRecordedSet,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, recordedSetsApiHandlers, recordedSetsMiddleware);
};
