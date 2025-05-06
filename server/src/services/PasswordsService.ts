import bcrypt from "bcryptjs";
import { Password } from "../models/passwordModel";

const saltRounds = 10;

class PasswordsService {
  // find password by user id
  static async findPasswordByUserId(userId: string) {
    try {
      return await Password.findOne({ userId });
    } catch (err: any) {
      throw err;
    }
  }

  static async hashPassword(userId: string, password: string) {
    try {
      const encryptedPassword = await bcrypt.hash(password, saltRounds);
      const encrypted = await Password.findOneAndUpdate({ userId, hash: encryptedPassword });

      return encrypted;
    } catch (e: any) {
      throw e;
    }
  }

  static async updatePassword(userId: string, newPassword: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      return await Password.findOneAndUpdate(
        { userId },
        { hash: hashedPassword },
        { upsert: true, new: true } // upsert creates if not found
      );
    } catch (err: any) {
      throw err;
    }
  }

  static async comparePasswords(userId: string, providedPassword: string) {
    try {
      const hashedPassword = await Password.findOne({ userId });

      if (!hashedPassword) {
        return null;
      }

      const match = await bcrypt.compare(providedPassword, hashedPassword.hash);

      return match;
    } catch (err: any) {
      throw err;
    }
  }

  static async deletePasswordByUserId(userId: string) {
    try {
      return await Password.findOneAndDelete({ userId });
    } catch (err: any) {
      throw err;
    }
  }
}

export default PasswordsService;
