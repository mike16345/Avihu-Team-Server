import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import RecordedSetsController from "../../controllers/recordedSetsController";
import { handleApiCall } from "../baseHandler";
import { validateRecordedSet } from "../../middleware/recordedSetMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/recordedSets";

const recordedSetsController = new RecordedSetsController();
const recordedSetsApiRoutes: ApiRouteHandlers = {
  [`POST ${BASE_PATH}`]: {
    handler: recordedSetsController.addRecordedSet,
    access: "public",
    middlewares: [validateRecordedSet],
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: recordedSetsController.getRecordedSetsByUserId,
    access: "public",
  },
  [`GET ${BASE_PATH}/user/exercise`]: {
    handler: recordedSetsController.getUserRecordedSetsByExercise,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: recordedSetsController.updateRecordedSetById,
    access: "public",
    middlewares: [validateRecordedSet],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: recordedSetsController.deleteRecordedSetById,
    access: "public",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, recordedSetsApiRoutes);
};
