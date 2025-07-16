import UserService from "./userService";
import PasswordsService from "./PasswordsService";
import SessionService from "./sessionService";
import { ISession } from "../models/sessionModel";
import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";
import { requireAdmin } from "../guards/AdminAccessGuard";

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
    const user = await this.userService.findOne({ email: email.toLowerCase() });

    if (!user) throw { message: "משתמש לא נמצא!", statusCode: StatusCode.NOT_FOUND };
    if (isAdminApp) {
      requireAdmin(user);
    }
    if (!user.hasAccess)
      throw { message: "אין גישה לכתובת המייל", statusCode: StatusCode.UNAUTHORIZED };

    const isMatch = await this.passwordsService.comparePasswords(user._id.toString(), password);
    if (!isMatch) throw { message: "מייל או סיסמא שגויים!", statusCode: StatusCode.NOT_FOUND };

    return this.sessionService.create({
      userId: user._id.toString(),
      data: { user, ip: metadata.ip, device: metadata.device },
      type: "login",
    } as ISession);
  }

  async register(email: string, password: string): Promise<IUser> {
    const user = await this.userService.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw { message: "משתמש לא נמצא!", statusCode: StatusCode.NOT_FOUND };
    }

    if (!user.hasAccess) {
      throw { message: "אין גישה לכתובת המייל", statusCode: StatusCode.UNAUTHORIZED };
    }

    await this.passwordsService.updatePassword(user._id.toString(), password);

    return user;
  }
}

export default AuthService;
