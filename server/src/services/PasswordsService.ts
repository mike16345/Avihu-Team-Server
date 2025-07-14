import bcrypt from "bcryptjs";
import { IPassword } from "../models/passwordModel";
import { BaseService } from "./BaseService";
import PasswordRepository from "../repositories/Password/PasswordRepository";

const SALT_ROUNDS = 10;

class PasswordsService extends BaseService<IPassword, PasswordRepository> {
  constructor() {
    super(new PasswordRepository(), "passwords");
  }

  async hashPassword(userId: string, plainPassword: string) {
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    return this.repository.updateOne({
      filter: { userId },
      update: { hash },
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    return this.repository.createByUser({ userId, hash }, userId);
  }

  async comparePasswords(userId: string, providedPassword: string) {
    const passwordDoc = await this.repository.findOne({ query: { userId } });

    return bcrypt.compare(providedPassword, passwordDoc.hash);
  }

  async deletePasswordByUserId(userId: string) {
    return this.repository.delete({ userId });
  }
}

export default PasswordsService;
