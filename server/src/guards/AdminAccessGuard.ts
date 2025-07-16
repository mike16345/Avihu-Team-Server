import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";

export const requireAdmin = (user: IUser | null) => {
  if (!user) {
    throw { message: "משתמש לא נמצא!", statusCode: StatusCode.NOT_FOUND };
  }

  if (!user.isAdmin) {
    throw { message: "אין הרשאה להתחבר כמנהל!", statusCode: StatusCode.FORBIDDEN };
  }
};
