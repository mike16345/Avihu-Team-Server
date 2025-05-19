import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { LessonGroupsController } from "../../controllers/LessonGroupsController";
import { validateLessonGroup } from "../../middleware/lessonGroupsMiddleware";

const BASE_PATH = "/lessonGroups";

const lessonGroupsApiHandler = {
  [`GET ${BASE_PATH}`]: LessonGroupsController.getLessonGroups,
  [`GET ${BASE_PATH}/one`]: LessonGroupsController.getLessonGroupById,
  [`PUT ${BASE_PATH}/one`]: LessonGroupsController.updateLessonGroup,
  [`POST ${BASE_PATH}`]: LessonGroupsController.addLessonGroup,
  [`DELETE ${BASE_PATH}/one`]: LessonGroupsController.deleteLessonGroup,
};

const lessonGroupsApiMiddleware = {
  [`POST ${BASE_PATH}`]: validateLessonGroup,
  [`PUT ${BASE_PATH}/one`]: validateLessonGroup,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, lessonGroupsApiHandler, lessonGroupsApiMiddleware);
};
