import { IUser } from "../interfaces/IUser";
import { deleteUserDataFromAllCollections } from "../utils/utils";
import { BaseService } from "./BaseService";
import UserRepository from "../repositories/User/UserRepository";

export default class UserService extends BaseService<IUser, UserRepository> {
  constructor() {
    super(new UserRepository(), "users");
  }

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
