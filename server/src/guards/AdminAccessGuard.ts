import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";
import { APIGatewayProxyEvent } from "aws-lambda";
import { User as UserModel } from "../models/userModel";
import type { RouteAccess } from "../types/lambdaTypes";

type UserRole = IUser["role"];

const AUTH_ERRORS = {
  userNotFound: {
    message: "משתמש לא נמצא!",
    statusCode: StatusCode.NOT_FOUND,
  },
  forbidden: {
    message: "אין לך הרשאה לבצע פעולה זו!",
    statusCode: StatusCode.FORBIDDEN,
  },
};

export const requireUser = (user: IUser | null): IUser => {
  if (!user) {
    throw AUTH_ERRORS.userNotFound;
  }

  return user;
};

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (user: IUser | null): IUser => {
    const existingUser = requireUser(user);

    if (!allowedRoles.includes(existingUser.role)) {
      throw AUTH_ERRORS.forbidden;
    }

    return existingUser;
  };
};

export const requireAdmin = requireRoles("admin");

export const requireTrainer = requireRoles("trainer", "admin");

export const requireAdminOrTrainer = requireRoles("admin", "trainer");

const parseBody = (event: APIGatewayProxyEvent): Record<string, unknown> => {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

const getRequestUserId = (event: APIGatewayProxyEvent): string | null => {
  const body = parseBody(event);

  const bodyUserId = body.userId;
  const bodyTrainerId = body.trainerId;

  const queryUserId = event.queryStringParameters?.userId;
  const queryTrainerId = event.queryStringParameters?.trainerId;

  if (typeof bodyUserId === "string") return bodyUserId;
  if (typeof bodyTrainerId === "string") return bodyTrainerId;
  if (typeof queryUserId === "string") return queryUserId;
  if (typeof queryTrainerId === "string") return queryTrainerId;

  return null;
};

const isRoleAllowed = (role: string, access: RouteAccess): boolean => {
  switch (access) {
    case "authenticated":
      return true;

    case "admin":
      return role === "admin";

    case "trainerOrAdmin":
      return role === "trainer" || role === "admin";

    case "public":
      return true;

    default:
      return false;
  }
};

export const enforceRequestUserAccess = async (
  event: APIGatewayProxyEvent,
  access: RouteAccess
) => {
  // TODO: Refactor to use session tokens instead of userId in body/query
  const userId = getRequestUserId(event);

  console.log("Enforcing access control for userId:", userId, "with access level:", access);
  if (!userId) {
    throw {
      message: "משתמש לא נמצא בבקשה!",
      statusCode: StatusCode.UNAUTHORIZED,
    };
  }

  const user = await UserModel.findById(userId);

  if (!user) {
    throw {
      message: "משתמש לא נמצא!",
      statusCode: StatusCode.UNAUTHORIZED,
    };
  }

  if (!isRoleAllowed(user.role, access)) {
    throw {
      message: "אין לך הרשאה לבצע פעולה זו!",
      statusCode: StatusCode.FORBIDDEN,
    };
  }

  return user;
};
