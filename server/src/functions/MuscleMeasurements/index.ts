import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import MuscleMeasurementController from "../../controllers/MuscleMeasurementController";

const BASE_PATH = "/measurements";

const muscleMeasurementController = new MuscleMeasurementController();

const muscleMeasurementsApiHandlers = {
  [`GET ${BASE_PATH}/one`]: muscleMeasurementController.getMeasurementsByUserId,
  [`POST ${BASE_PATH}`]: muscleMeasurementController.saveMeasurement,
  [`DELETE ${BASE_PATH}`]: muscleMeasurementController.removeMeasurement,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, muscleMeasurementsApiHandlers);
};
