import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { LessonGroupsController } from "../../controllers/LessonGroupsController";
import { validateLessonGroup } from "../../middleware/lessonGroupsMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/lessonGroups";

const lessonGroupController = new LessonGroupsController();

const lessonGroupApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: lessonGroupController.getAll,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/paginated`]: {
    handler: lessonGroupController.getPaginated,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: lessonGroupController.getById,
    access: "subtrainer",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: lessonGroupController.updateById,
    access: "subtrainer",
    middlewares: [validateLessonGroup],
  },
  [`POST ${BASE_PATH}`]: {
    handler: lessonGroupController.create,
    access: "subtrainer",
    middlewares: [validateLessonGroup],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: lessonGroupController.deleteById,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, lessonGroupApiRoutes);
};
