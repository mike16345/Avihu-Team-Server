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

  createUserWithWelcome = async (userToCreate: Partial<IUser>) => {
    const user = await this.create(userToCreate as IUser);

    if (user) {
      const phoneNumber = user.phone.replace(/\D/g, "");
      await new PasswordsService().hashPassword(user._id.toString(), phoneNumber);

      const mailOptions = {
        to: user.email,
        ...welcomeEmailTemplate(phoneNumber),
      };

      await new EmailService().sendEmail(mailOptions);
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
