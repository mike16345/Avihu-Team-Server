import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import ProgressNotesController from "../../controllers/ProgressNotesController";
import { validateUserProgressNote } from "../../middleware/UserProgressNoteMiddleware";

const BASE_PATH = "/progressNote";

const progressNoteController = new ProgressNotesController();

const progressNoteApiHandlers = {
  [`GET ${BASE_PATH}/one`]: progressNoteController.getProgressNotesByUserId,
  [`POST ${BASE_PATH}`]: progressNoteController.addProgressNote,
  [`DELETE ${BASE_PATH}`]: progressNoteController.removeProgressNote,
};

export const progressNoteMiddleWare = {
  [`POST ${BASE_PATH}`]: validateUserProgressNote,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, progressNoteApiHandlers, progressNoteMiddleWare);
};
