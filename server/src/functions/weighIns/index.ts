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
    access: "public",
  },
  [`GET ${BASE_PATH}/user`]: {
    handler: weighInsController.getWeighInsByUserId,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: weighInsController.updateWeighIn,
    access: "public",
    middlewares: [validateWeighIn],
  },
  [`POST ${BASE_PATH}/bulk`]: {
    handler: weighInsController.addManyWeighIns,
    access: "trainerOrAdmin",
  },
  [`POST ${BASE_PATH}`]: {
    handler: weighInsController.addWeighIn,
    access: "public",
    middlewares: [validateWeighIn],
  },
  [`DELETE ${BASE_PATH}/user`]: {
    handler: weighInsController.delete,
    access: "trainerOrAdmin",
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: weighInsController.deleteWeighInById,
    access: "public",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, weighInApiRoutes);
};
