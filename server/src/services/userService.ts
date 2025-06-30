import { FilterQuery } from "mongoose";
import { IUser } from "../interfaces/IUser";
import { User } from "../models/userModel";
import { deleteUserDataFromAllCollections } from "../utils/utils";
import { BaseService } from "./BaseService";
import UserRepository from "../repositories/User/UserRepository";

export default class UserService extends BaseService<IUser, UserRepository> {
  constructor() {
    super(new UserRepository(), "users");
  }

  deleteUser = async (id: string) => {
    try {
      const user = await this.repository.deleteById(id);

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
      const user = await User.findByIdAndUpdate(id, { [fieldName]: fieldValue }, { new: true });

      if (user) this.cache.invalidateAll();

      return user;
    } catch (error) {
      throw error;
    }
  };

  updateImagesUploadedstatus = async (id: string, status: string) => {
    try {
      const user = await User.findByIdAndUpdate(id, { imagesUploaded: status }, { new: true });
      if (user) this.cache.invalidateAll();

      return user;
    } catch (error) {
      throw error;
    }
  };
}
