import { UserController } from "../../controllers/userController";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { validateUser } from "../../middleware/usersMiddleware";
import { scheduleUserChecks } from "../../middleware/analyticsMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/users";
const userController = new UserController();

const userApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: userController.getAll,
    access: "admin",
  },

  [`GET ${BASE_PATH}/one`]: {
    handler: userController.getById,
    access: "public",
  },

  [`PUT ${BASE_PATH}/one`]: {
    handler: userController.updateById,
    access: "trainerOrAdmin",
  },

  [`POST ${BASE_PATH}`]: {
    handler: userController.addUser,
    access: "trainerOrAdmin",
    middlewares: [validateUser],
  },

  [`DELETE ${BASE_PATH}/one`]: {
    handler: userController.deleteById,
    access: "trainerOrAdmin",
  },

  [`PUT ${BASE_PATH}/one/field`]: {
    handler: userController.updateUserField,
    access: "trainerOrAdmin",
    middlewares: [scheduleUserChecks],
  },

  [`GET ${BASE_PATH}/user/email`]: {
    handler: userController.checkUsersAccess,
    access: "public",
  },

  [`PUT ${BASE_PATH}/user/register`]: {
    handler: userController.register,
    access: "public",
  },

  [`POST ${BASE_PATH}/user/login`]: {
    handler: userController.logIn,
    access: "public",
  },

  [`POST ${BASE_PATH}/user/session`]: {
    handler: userController.checkUserSessionToken,
    access: "public",
  },

  [`POST ${BASE_PATH}/auth/login`]: {
    handler: userController.logIn,
    access: "public",
  },

  [`POST ${BASE_PATH}/auth/refresh`]: {
    handler: userController.refreshAuth,
    access: "public",
  },

  [`POST ${BASE_PATH}/auth/logout`]: {
    handler: userController.logoutAuth,
    access: "public",
  },

  [`GET ${BASE_PATH}/auth/me`]: {
    handler: userController.me,
    access: "public",
  },
};

const userValidaters = {
  [`POST ${BASE_PATH}`]: validateUser,
  [`PUT ${BASE_PATH}/one/field`]: scheduleUserChecks,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, userApiRoutes);
};
