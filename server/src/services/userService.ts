import { CheckInModel } from "../models/checkInModel";
import { User } from "../models/userModel";

export class UserService {
  static async createUser(data: any) {
    try {
      const newUser = await User.create(data);

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  static async getUsers() {
    try {
      const users = await User.find({}).lean();

      return users;
    } catch (error) {
      throw error;
    }
  }

  static async getUser(id: string) {
    try {
      const user = await User.findById({ _id: id }).lean();

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async getUserByEmail(email: string) {
    try {
      const user = await User.findOne({ email }).lean();

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(data: any, id?: string) {
    try {
      const user = await User.findByIdAndUpdate({ _id: id }, data, {
        new: true,
      });

      if (!user) {
        return "User not available";
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateManyUsers(data: any[]) {
    try {
      const updatedUsers = await Promise.all(
        data.map(async (user) => {
          return await UserService.updateUser(user);
        })
      );

      return updatedUsers;
    } catch (error) {
      throw error;
    }
  }

  static async deleteUser(id: string) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return "User not available!";
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}
