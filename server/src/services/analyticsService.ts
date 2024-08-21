import { CheckInModel } from "../models/checkInModel";
import { User } from "../models/userModel";

export class AnalyticsService {
  static async getAllCheckInUsers() {
    try {
      const allUsers = await CheckInModel.find();
      const users = [];

      for (const u of allUsers) {
        if (!u.isChecked) {
          const user = await User.findById(u._id).select(`firstName lastName`);

          users.push({
            expiresAt: u.expiresAt,
            isChecked: u.isChecked,
            _id: u._id,
            firstName: user?.firstName,
            lastName: user?.lastName,
          });
        }
      }

      return users;
    } catch (error) {
      throw error;
    }
  }

  /*   static async updateMany() {
    try {
      const users = await CheckInModel.find();

      for (const u of users) {
        const user = await CheckInModel.findByIdAndUpdate(u._id, {
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        console.log(user);
      }
      return users;
    } catch (error) {
      throw error;
    }
  } */

  static async checkOffuser(id: string) {
    try {
      const user = CheckInModel.findByIdAndUpdate(id, { isChecked: true }, { new: true });

      return user;
    } catch (error) {
      throw error;
    }
  }
}
