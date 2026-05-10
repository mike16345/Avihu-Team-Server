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
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/paginated`]: {
    handler: trainerController.getPaginated,
    access: "trainerOrAdmin",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: trainerController.getOne,
    access: "trainerOrAdmin",
  },
  [`POST ${BASE_PATH}`]: {
    handler: trainerController.create,
    access: "trainerOrAdmin",
    middlewares: [validateTrainer],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: trainerController.update,
    access: "trainerOrAdmin",
    middlewares: [validateTrainer],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: trainerController.delete,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, trainerApiRoutes);
};
