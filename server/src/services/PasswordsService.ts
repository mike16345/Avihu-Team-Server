import bcrypt from "bcrypt";
import { Password } from "../models/passwordModel";
import UserService from "./userService";

const saltRounds = 8;

class PasswordsService {
  static async hashPassword(email: string, password: string) {
    try {
      const user = await UserService.getUserByEmail({ email });
      const encryptedPassword = await bcrypt.hash(password, saltRounds);

      if (!user) {
        return null;
      }
      const encrypted = await Password.create({ userId: user._id, hash: encryptedPassword });

      return encrypted;
    } catch (e: any) {
      throw e;
    }
  }

  static async comparePasswords(email: string, providedPassword: string) {
    try {
      const user = await UserService.getUserByEmail({ email });
      const hashedPassword = await Password.findOne({ userId: user?._id });
      if (!hashedPassword) {
        return null;
      }

      const match = await bcrypt.compare(providedPassword, hashedPassword.hash);

      return match;
    } catch (err: any) {
      throw err;
    }
  }
}

export default PasswordsService;
