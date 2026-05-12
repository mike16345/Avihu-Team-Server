import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WeighInsController from "../../controllers/weighInsController";
import { handleApiCall } from "../baseHandler";
import { validateWeighIn } from "../../middleware/weighInsMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/weighIns/weights";

const weighInsController = new WeighInsController();

const weighInApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/one`]: {
    handler: weighInsController.getById,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: weighInsController.getWeighInsByUserId,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: weighInsController.updateWeighIn,
    access: "authenticated",
    middlewares: [validateWeighIn],
  },
  [`POST ${BASE_PATH}/bulk`]: {
    handler: weighInsController.addManyWeighIns,
    access: "subtrainer",
  },
  [`POST ${BASE_PATH}`]: {
    handler: weighInsController.addWeighIn,
    access: "authenticated",
    middlewares: [validateWeighIn],
  },
  [`DELETE ${BASE_PATH}/user`]: {
    handler: weighInsController.delete,
    access: "subtrainer",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: weighInsController.deleteWeighInById,
    access: "authenticated",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, weighInApiRoutes);
};
