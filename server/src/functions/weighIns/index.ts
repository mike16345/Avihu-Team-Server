import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WeighInsController from "../../controllers/weighInsController";
import { handleApiCall } from "../baseHandler";
import { validateWeighIn } from "../../middleware/weighInsMiddleware";

const BASE_PATH = "/weighIns/weights";

const weighInsController = new WeighInsController();

const weighInApiHandlers = {
  [`GET ${BASE_PATH}/one`]: weighInsController.getById,
  [`GET ${BASE_PATH}/user`]: weighInsController.getWeighInsByUserId,
  [`PUT ${BASE_PATH}/one`]: weighInsController.updateWeighIn,
  [`POST ${BASE_PATH}/bulk`]: weighInsController.addManyWeighIns,
  [`POST ${BASE_PATH}`]: weighInsController.addWeighIn,
  [`DELETE ${BASE_PATH}/user`]: weighInsController.delete,
  [`DELETE ${BASE_PATH}/one`]: weighInsController.delete,
};

const weighInApiValidators = {
  [`POST ${BASE_PATH}`]: validateWeighIn,
  [`PUT ${BASE_PATH}/one`]: validateWeighIn,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, weighInApiHandlers, weighInApiValidators);
};
