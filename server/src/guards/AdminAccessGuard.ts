import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";
import { User as UserModel } from "../models/userModel";
import JwtAuthService, { AccessClaims } from "../services/JwtAuthService";
import { extractBearerToken } from "../utils/utils";
import type { AppEvent, RouteAccess } from "../types/lambdaTypes";

type UserRole = IUser["role"];
type VerifiedAccessClaims = AccessClaims & { userId?: string };

const jwtAuthService = new JwtAuthService();
const accessRank = {
  public: 0,
  authenticated: 1,
  subtrainer: 2,
  trainer: 3,
  admin: 4,
} as const;

const roleRank: Record<
  UserRole,
  | typeof accessRank.authenticated
  | typeof accessRank.subtrainer
  | typeof accessRank.trainer
  | typeof accessRank.admin
> = {
  user: accessRank.authenticated,
  subTrainer: accessRank.subtrainer,
  trainer: accessRank.trainer,
  admin: accessRank.admin,
};

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

export const allowedAdminAppRoles: UserRole[] = ["admin", "trainer", "subTrainer"];

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

const getVerifiedUserId = (claims: VerifiedAccessClaims): string => {
  const userId = claims.userId;

  if (!userId) {
    throw AUTH_ERRORS.unauthorized;
  }

  return userId;
};

const isRoleAllowed = (
  role: UserRole,
  access: Exclude<RouteAccess, "public" | "authenticated">
): boolean => {
  return roleRank[role] >= accessRank[access];
};

export const enforceRequestUserAccess = async (event: AppEvent, access: RouteAccess) => {
  const token = extractBearerToken(event.headers || {});
  const claims = jwtAuthService.verifyAccessToken(token) as VerifiedAccessClaims;
  const userId = getVerifiedUserId(claims);

  const user = await UserModel.findById(userId).lean();

  if (!user || user.isDeleted) {
    throw AUTH_ERRORS.userNotFound;
  }

  if (!user.hasAccess) {
    throw AUTH_ERRORS.forbidden;
  }

  if (access !== "authenticated" && !isRoleAllowed(user.role, access)) {
    throw AUTH_ERRORS.forbidden;
  }

  return user;
};
