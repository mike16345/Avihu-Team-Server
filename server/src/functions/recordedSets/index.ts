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
    access: "authenticated",
    middlewares: [validateRecordedSet],
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: recordedSetsController.getRecordedSetsByUserId,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/user/exercise`]: {
    handler: recordedSetsController.getUserRecordedSetsByExercise,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: recordedSetsController.updateRecordedSetById,
    access: "authenticated",
    middlewares: [validateRecordedSet],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: recordedSetsController.deleteRecordedSetById,
    access: "authenticated",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, recordedSetsApiRoutes);
};
