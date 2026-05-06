import { IUser } from "../interfaces/IUser";
import { deleteUserDataFromAllCollections } from "../utils/utils";
import { BaseService } from "./BaseService";
import UserRepository from "../repositories/User/UserRepository";
import PasswordsService from "./PasswordsService";
import { EmailService } from "./EmailService";
import { welcomeEmailTemplate } from "../utils/emailTemplates";

export default class UserService extends BaseService<IUser, UserRepository> {
  constructor() {
    super(new UserRepository(), "users");
  }

  createUserWithWelcome = async (
    userToCreate: Partial<IUser>,
    options?: { initialPassword?: string }
  ) => {
    const user = await this.create(userToCreate as IUser);

    try {
      const initialPassword =
        options?.initialPassword || (user.phone ? user.phone.replace(/\D/g, "") : undefined);

      if (!initialPassword) {
        throw new Error("Initial password is required when user phone is not provided.");
      }

      await new PasswordsService().hashPassword(user._id.toString(), initialPassword);

      const mailOptions = {
        to: user.email,
        ...welcomeEmailTemplate(initialPassword),
      };

      await new EmailService().sendEmail(mailOptions);
    } catch (error) {
      await new PasswordsService()
        .deletePasswordByUserId(user._id.toString())
        .catch(() => undefined);
      await this.hardDeleteById(user._id.toString()).catch(() => undefined);
      throw error;
    }

    return user;
  };

  deleteUser = async (id: string) => {
    try {
      const user = await this.deleteById(id);

      if (user) {
        this.cache.invalidateAll();
        await deleteUserDataFromAllCollections(id);
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  updateUserField = async (id: string, fieldName: string, fieldValue: string) => {
    try {
      const user = await this.updateById(id, { [fieldName]: fieldValue });

      if (user) this.cache.invalidateAll();

      return user;
    } catch (error) {
      throw error;
    }
  };
}
