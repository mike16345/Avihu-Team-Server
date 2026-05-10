import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import ProgressNotesController from "../../controllers/ProgressNotesController";
import { validateUserProgressNote } from "../../middleware/UserProgressNoteMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/progressNote";

const progressNoteController = new ProgressNotesController();

const progressNoteApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/one`]: {
    handler: progressNoteController.getProgressNotesByUserId,
    access: "trainerOrAdmin",
  },
  [`POST ${BASE_PATH}`]: {
    handler: progressNoteController.addProgressNote,
    access: "trainerOrAdmin",
    middlewares: [validateUserProgressNote],
  },
  [`PUT ${BASE_PATH}`]: {
    handler: progressNoteController.updateProgressNote,
    access: "trainerOrAdmin",
    middlewares: [validateUserProgressNote],
  },
  [`DELETE ${BASE_PATH}`]: {
    handler: progressNoteController.removeProgressNote,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, progressNoteApiRoutes);
};
