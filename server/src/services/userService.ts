import { User } from "../models/userModel";

export class UserService {
  async createUser(data: any) {
    try {
      const newUser = await User.create(data);

      return newUser;
    } catch (error) {
      console.log(error);
    }
  }

  async getUsers() {
    try {
      const users = await User.find({}).lean();

      return users;
    } catch (error) {
      console.log(error);
    }
  }

  async getUser(id: string) {
    try {
      const user = await User.findById({ _id: id }).lean();

      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await User.findOne({ email }).lean();

      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async updateUser(data: any) {
    try {
      const user = await User.findByIdAndUpdate({ _id: data._id }, data, {
        new: true,
      });

      if (!user) {
        return "User not available";
      }

      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async updateManyUsers(data: any[]) {
    try {
      const updatedUsers = await Promise.all(
        data.map(async (user) => {
          return await this.updateUser(user);
        })
      );

      return updatedUsers;
    } catch (error) {
      console.log(error);
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return "User not available!";
      }

      return user;
    } catch (error) {
      console.log(error);
    }
  }
}

export const userServices = new UserService();
