import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import MuscleMeasurementController from "../../controllers/MuscleMeasurementController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/measurements";

const muscleMeasurementController = new MuscleMeasurementController();

const muscleMeasurementsApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/one`]: {
    handler: muscleMeasurementController.getMeasurementsByUserId,
    access: "public",
  },
  [`POST ${BASE_PATH}`]: {
    handler: muscleMeasurementController.saveMeasurement,
    access: "public",
  },
  [`DELETE ${BASE_PATH}`]: {
    handler: muscleMeasurementController.removeMeasurement,
    access: "public",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, muscleMeasurementsApiRoutes);
};
