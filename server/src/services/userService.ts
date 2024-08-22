import { CheckInModel } from "../models/checkInModel";
import { User } from "../models/userModel";

export class UserService {
  static async createUser(data: any) {
    try {
      const newUser = await User.create(data);

      const newCheckIn = await CheckInModel.create({
        _id: newUser._id,
        remindIn: newUser.remindIn,
        lastUpdatedAt: new Date(),
      });

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

      const correspondingCheckIn = await CheckInModel.findById(user._id);
      if (correspondingCheckIn) {
        if (user.remindIn !== correspondingCheckIn?.remindIn) {
          correspondingCheckIn.remindIn = user.remindIn;

          await CheckInModel.findByIdAndUpdate(correspondingCheckIn._id, {
            remindIn: user.remindIn,
          });
        }
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

      const deleteCheckIn = await CheckInModel.findByIdAndDelete(id);

      return user;
    } catch (error) {
      throw error;
    }
  }
}
