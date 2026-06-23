import { IUser } from "../interfaces/IUser";
import { User as UserModel } from "../models/userModel";
import JwtAuthService, { AccessClaims } from "../services/JwtAuthService";
import { extractBearerToken } from "../utils/utils";
import type { AppEvent, RouteAccess } from "../types/lambdaTypes";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes";
import { createForbiddenError, createUnauthorizedError } from "../utils/httpErrors";

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
  unauthorized: createUnauthorizedError(AUTH_ERROR_CODES.INVALID_TOKEN),
  userNotFound: createUnauthorizedError(AUTH_ERROR_CODES.USER_NOT_FOUND, "User not found"),
  accessRevoked: createForbiddenError(AUTH_ERROR_CODES.ACCESS_REVOKED, "Unauthorized"),
  userBlocked: createForbiddenError(AUTH_ERROR_CODES.USER_BLOCKED, "Unauthorized"),
  forbidden: createForbiddenError(),
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
  const userId = claims.userId || claims.sub || claims._id;

  if (!userId) {
    throw AUTH_ERRORS.unauthorized;
  }

  return userId;
};

const isRoleAllowed = (role: UserRole, access: RouteAccess): boolean => {
  const userRank = roleRank[role];
  const rank = accessRank[access];

  console.log("User Rank:", userRank);
  console.log("Access Rank:", rank);

  return roleRank[role] >= accessRank[access];
};

export const enforceRequestUserAccess = async (event: AppEvent, access: RouteAccess) => {
  const token = extractBearerToken(event.headers || {});
  const claims = jwtAuthService.verifyAccessToken(token) as VerifiedAccessClaims;
  const userId = getVerifiedUserId(claims);

  const user = await UserModel.findById(userId).lean();

  if (!user || user.isDeleted) {
    console.log("User was not found.");
    throw AUTH_ERRORS.userNotFound;
  }

  if (user.accountStatus === "disabled") {
    console.log("User is blocked from the app.");
    throw AUTH_ERRORS.userBlocked;
  }

  if (!user.hasAccess) {
    console.log("User has no access to app.");
    throw AUTH_ERRORS.accessRevoked;
  }

  if (access !== "authenticated" && !isRoleAllowed(user.role, access)) {
    console.log("User does not meet the requirements to access this route.");
    throw AUTH_ERRORS.forbidden;
  }

  event.authUser = user as any;

  return user;
};
