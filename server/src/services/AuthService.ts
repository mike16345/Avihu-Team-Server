import UserService from "./userService";
import PasswordsService from "./PasswordsService";
import SessionService from "./sessionService";
import { ISession } from "../models/sessionModel";
import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";
import { allowedAdminAppRoles, requireRoles } from "../guards/AdminAccessGuard";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes";

class AuthService {
  private userService = new UserService();
  private passwordsService = new PasswordsService();
  private sessionService = new SessionService();

  async login(
    email: string,
    password: string,
    isAdminApp = false,
    metadata: { ip?: string; device?: string } = {}
  ): Promise<ISession> {
    console.warn(
      `Login attempt for email: ${email} from IP: ${metadata.ip} using device: ${metadata.device}`
    );
    const user = await this.userService.findOneUnscoped({ email: email.toLowerCase() });
    console.warn(
      `passing user service, found user: ${user ? user._id : "no user found"} with email: ${email}`
    );

    if (!user) {
      throw {
        message: "משתמש לא קיים במערכת",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      };
    }

    if (isAdminApp) {
      requireRoles(...allowedAdminAppRoles, user.role);
    }

    if (user.accountStatus === "disabled") {
      throw {
        message: "אין למשתמש גישה",
        statusCode: StatusCode.FORBIDDEN,
        code: AUTH_ERROR_CODES.USER_BLOCKED,
      };
    }

    if (!user.hasAccess) {
      throw {
        message: "אין למשתמש גישה",
        statusCode: StatusCode.FORBIDDEN,
        code: AUTH_ERROR_CODES.ACCESS_REVOKED,
      };
    }

    const isMatch = await this.passwordsService.comparePasswords(user._id.toString(), password);
    if (!isMatch) {
      throw {
        message: "פרטי גישה שגויים",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      };
    }

    const now = new Date();

    return this.sessionService.create({
      userId: user._id.toString(),
      data: { user, ip: metadata.ip, device: metadata.device },
      type: "login",
      createdAt: now,
      updatedAt: now,
    } as ISession);
  }

  async register(email: string, password: string): Promise<IUser> {
    const user = await this.userService.findOneUnscoped({ email: email.toLowerCase() });

    if (!user) {
      throw { message: "משתמש לא נמצא!", statusCode: StatusCode.NOT_FOUND };
    }

    if (!user.hasAccess) {
      throw {
        message: "אין גישה לכתובת המייל",
        statusCode: StatusCode.UNAUTHORIZED,
        code: AUTH_ERROR_CODES.ACCESS_REVOKED,
      };
    }

    await this.passwordsService.updatePassword(user._id.toString(), password);

    return user;
  }
}

export default AuthService;
