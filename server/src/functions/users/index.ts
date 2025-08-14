import { UserController } from "../../controllers/userController";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { validateUser } from "../../middleware/usersMiddleware";
import { scheduleUserChecks } from "../../middleware/analyticsMiddleware";

const BASE_PATH = "/users";
const userController = new UserController();
const userApiHandlers = {
  [`GET ${BASE_PATH}`]: userController.getAll,
  [`GET ${BASE_PATH}/one`]: userController.getById,
  [`PUT ${BASE_PATH}/one`]: userController.updateById,
  [`POST ${BASE_PATH}`]: userController.addUser,
  [`DELETE ${BASE_PATH}/one`]: userController.deleteById,
  [`PUT ${BASE_PATH}/one/field`]: userController.updateUserField,
  [`GET ${BASE_PATH}/user/email`]: userController.checkUsersAccess,
  [`PUT ${BASE_PATH}/user/register`]: userController.register,
  [`POST ${BASE_PATH}/user/login`]: userController.logIn,
  [`POST ${BASE_PATH}/user/session`]: userController.checkUserSessionToken,
  [`POST ${BASE_PATH}/user/lead`]: userController.saveLead,
};

const userValidaters = {
  [`POST ${BASE_PATH}`]: validateUser,
  [`PUT ${BASE_PATH}/one/field`]: scheduleUserChecks,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, userApiHandlers, userValidaters);
};
