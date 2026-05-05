import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import TrainerController from "../../controllers/trainerController";
import { validateTrainer } from "../../middleware/trainersMiddleware";

const BASE_PATH = "/trainers";

const trainerController = new TrainerController();

const trainerApiHandlers = {
  [`GET ${BASE_PATH}`]: trainerController.getAll,
  [`GET ${BASE_PATH}/paginated`]: trainerController.getPaginated,
  [`GET ${BASE_PATH}/one`]: trainerController.getOne,
  [`POST ${BASE_PATH}`]: trainerController.create,
  [`PUT ${BASE_PATH}/one`]: trainerController.update,
  [`DELETE ${BASE_PATH}/one`]: trainerController.delete,
};

const trainerValidators = {
  [`POST ${BASE_PATH}`]: validateTrainer,
  [`PUT ${BASE_PATH}/one`]: validateTrainer,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, trainerApiHandlers, trainerValidators);
};
