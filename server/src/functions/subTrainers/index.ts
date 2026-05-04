import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import SubTrainerController from "../../controllers/subTrainerController";
import {
  validateCreateSubTrainer,
  validateUpdateSubTrainer,
} from "../../middleware/subTrainersMiddleware";

const BASE_PATH = "/subTrainers";

const subTrainerController = new SubTrainerController();

const subTrainerApiHandlers = {
  [`GET ${BASE_PATH}`]: subTrainerController.getAll,
  [`GET ${BASE_PATH}/paginated`]: subTrainerController.getPaginated,
  [`GET ${BASE_PATH}/one`]: subTrainerController.getOne,
  [`POST ${BASE_PATH}`]: subTrainerController.create,
  [`PUT ${BASE_PATH}/one`]: subTrainerController.update,
  [`DELETE ${BASE_PATH}/one`]: subTrainerController.delete,
};

const subTrainerValidators = {
  [`POST ${BASE_PATH}`]: validateCreateSubTrainer,
  [`PUT ${BASE_PATH}/one`]: validateUpdateSubTrainer,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, subTrainerApiHandlers, subTrainerValidators);
};
