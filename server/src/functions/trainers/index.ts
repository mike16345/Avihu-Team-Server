import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import TrainerController from "../../controllers/trainerController";
import { validateTrainer } from "../../middleware/trainersMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/trainers";

const trainerController = new TrainerController();

const trainerApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: trainerController.getAll,
    access: "admin",
  },
  [`GET ${BASE_PATH}/paginated`]: {
    handler: trainerController.getPaginated,
    access: "admin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: trainerController.getOne,
    access: "admin",
  },
  [`POST ${BASE_PATH}`]: {
    handler: trainerController.create,
    access: "admin",
    middlewares: [validateTrainer],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: trainerController.update,
    access: "admin",
    middlewares: [validateTrainer],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: trainerController.delete,
    access: "admin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, trainerApiRoutes);
};
