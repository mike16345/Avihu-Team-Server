import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import UserProgressNotesController from "../../controllers/userProgressNotesController";
import { validateUserProgressNote } from "../../middleware/UserProgressNoteMiddleware";

const BASE_PATH = "/userProgressNote";

const userProgressNoteController = new UserProgressNotesController();

const userProgressNoteApiHandlers = {
  [`GET ${BASE_PATH}/one`]: userProgressNoteController.getProgressNotesByUserId,
  [`POST ${BASE_PATH}`]: userProgressNoteController.addProgressNote,
  [`DELETE ${BASE_PATH}`]: userProgressNoteController.removeProgressNote,
};

export const userProgressNoteMiddleWare = {
  [`POST ${BASE_PATH}`]: validateUserProgressNote,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(
    event,
    context,
    userProgressNoteApiHandlers,
    userProgressNoteMiddleWare
  );
};
