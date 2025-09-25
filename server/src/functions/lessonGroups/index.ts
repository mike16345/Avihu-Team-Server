import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { LessonGroupsController } from "../../controllers/LessonGroupsController";
import { validateLessonGroup } from "../../middleware/lessonGroupsMiddleware";

const BASE_PATH = "/lessonGroups";

const lessonGroupController = new LessonGroupsController();

const lessonGroupsApiHandler = {
  [`GET ${BASE_PATH}`]: lessonGroupController.getAll,
  [`GET ${BASE_PATH}/paginated`]: lessonGroupController.getPaginated,
  [`GET ${BASE_PATH}/one`]: lessonGroupController.getById,
  [`PUT ${BASE_PATH}/one`]: lessonGroupController.updateById,
  [`POST ${BASE_PATH}`]: lessonGroupController.create,
  [`DELETE ${BASE_PATH}/one`]: lessonGroupController.deleteById,
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
