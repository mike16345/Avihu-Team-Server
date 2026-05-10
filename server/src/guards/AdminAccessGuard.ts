import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";
import { User as UserModel } from "../models/userModel";
import JwtAuthService, { AccessClaims } from "../services/JwtAuthService";
import { extractBearerToken } from "../utils/utils";
import type { AppEvent, RouteAccess } from "../types/lambdaTypes";

type UserRole = IUser["role"];
type VerifiedAccessClaims = AccessClaims & { sub?: string; _id?: string; type?: string };

const jwtAuthService = new JwtAuthService();

const AUTH_ERRORS = {
  unauthorized: {
    message: "Unauthorized",
    statusCode: StatusCode.UNAUTHORIZED,
  },
  userNotFound: {
    message: "User not found",
    statusCode: StatusCode.UNAUTHORIZED,
  },
  forbidden: {
    message: "Forbidden",
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

const getVerifiedUserId = (claims: VerifiedAccessClaims): string => {
  const userId = claims.sub || claims.userId || claims._id;

  if (!userId) {
    throw AUTH_ERRORS.unauthorized;
  }

  return userId;
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

export const enforceRequestUserAccess = async (event: AppEvent, access: RouteAccess) => {
  const token = extractBearerToken(event.headers || {});
  const claims = jwtAuthService.verifyAccessToken(token) as VerifiedAccessClaims;
  const userId = getVerifiedUserId(claims);

  const user = await UserModel.findById(userId);

  if (!user || user.isDeleted) {
    throw AUTH_ERRORS.userNotFound;
  }

  if (!user.hasAccess) {
    throw AUTH_ERRORS.forbidden;
  }

  if (!isRoleAllowed(user.role, access)) {
    throw AUTH_ERRORS.forbidden;
  }

  event.authUser = user;

  return user;
};
