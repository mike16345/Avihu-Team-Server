import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import SubTrainerController from "../../controllers/subTrainerController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
import {
  validateCreateSubTrainer,
  validateUpdateSubTrainer,
} from "../../middleware/subTrainersMiddleware";

const BASE_PATH = "/subTrainers";

const subTrainerController = new SubTrainerController();

const subTrainerApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: subTrainerController.getAll,
    access: "trainer",
  },
  [`GET ${BASE_PATH}/paginated`]: {
    handler: subTrainerController.getPaginated,
    access: "trainer",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: subTrainerController.getOne,
    access: "trainer",
  },
  [`POST ${BASE_PATH}`]: {
    handler: subTrainerController.create,
    access: "trainer",
    middlewares: [validateCreateSubTrainer],
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: subTrainerController.update,
    access: "trainer",
    middlewares: [validateUpdateSubTrainer],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: subTrainerController.delete,
    access: "trainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, subTrainerApiRoutes);
};
