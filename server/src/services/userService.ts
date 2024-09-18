//@ts-nocheck
import { DataBrew } from "aws-sdk";
import { User } from "../models/userModel";
import { Cache } from "../utils/cache";
import connect, { conn } from "../db/connect";
import { deleteUserFromAllCollections } from "../utils/utils";
import mongoose from "mongoose";

let cachedUsers = new Cache<IUser[]>();
let singleUsersCache = new Cache<IUser>();

class UserService {
  static async createUser(data) {
    try {
      const newUser = await User.create(data);
      cachedUsers.invalidateAll();

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  static async getUsers() {
    const cached = cachedUsers.get("all");

    try {
      const users = cached || (await User.find());
      cachedUsers.set("all", users);

      return users;
    } catch (error) {
      throw error;
    }
  }

  static async getUser(id) {
    const cached = singleUsersCache.get(id);
    try {
      const user = cached || (await User.findById(id).lean());
      singleUsersCache.set(id, user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async getUserByEmail(email) {
    const cached = singleUsersCache.get(email);

    try {
      const user = cached || (await User.findOne({ email }).lean());
      singleUsersCache.set(email, user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(data, id) {
    try {
      const user = await User.findByIdAndUpdate(id, data, { new: true });

      if (user) {
        cachedUsers.invalidateAll();
        singleUsersCache.invalidate(id);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateManyUsers(data) {
    try {
      const updatedUsers = await Promise.all(
        data.map(async (user) => {
          return await UserService.updateUser(user, user._id);
        })
      );
      singleUsersCache.invalidateAll();
      cachedUsers.invalidateAll();

      return updatedUsers;
    } catch (error) {
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (user) {
        cachedUsers.invalidateAll();
        singleUsersCache.invalidate(id);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;
