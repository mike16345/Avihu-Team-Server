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
  [`GET ${BASE_PATH}/block-backgrounds`]: {
    handler: trainerController.getBlockBackgrounds,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/block-backgrounds`]: {
    handler: trainerController.upsertBlockBackground,
    access: "admin",
  },
  [`DELETE ${BASE_PATH}/block-backgrounds`]: {
    handler: trainerController.deleteBlockBackground,
    access: "admin",
  },
  [`GET ${BASE_PATH}/block-tip-defaults`]: {
    handler: trainerController.getBlockTipDefaults,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/block-tip-defaults`]: {
    handler: trainerController.upsertBlockTipDefault,
    access: "admin",
  },
  [`DELETE ${BASE_PATH}/block-tip-defaults`]: {
    handler: trainerController.deleteBlockTipDefault,
    access: "admin",
  },
  [`GET ${BASE_PATH}/diet-tip-goals`]: {
    handler: trainerController.getDietTipGoals,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/diet-tip-goals`]: {
    handler: trainerController.upsertDietTipGoal,
    access: "admin",
  },
  [`DELETE ${BASE_PATH}/diet-tip-goals`]: {
    handler: trainerController.deleteDietTipGoal,
    access: "admin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, trainerApiRoutes);
};
