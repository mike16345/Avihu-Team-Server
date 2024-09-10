import { Model } from "mongoose";
import { CheckInModel } from "../models/checkInModel";
import { DietPlan } from "../models/dietPlanModel";
import { User } from "../models/userModel";
import { WorkoutPlan } from "../models/workoutPlanModel";

export class AnalyticsService {
  static async getAllCheckInUsers() {
    try {
      const allUsers = await CheckInModel.find({ isChecked: false });
      const users = [];

      for (const u of allUsers) {
        const user = await User.findById(u._id).select(`firstName lastName`);

        users.push({
          isChecked: u.isChecked,
          _id: u._id,
          firstName: user?.firstName,
          lastName: user?.lastName,
        });
      }

      return users;
    } catch (error) {
      throw error;
    }
  }

  static async createNewCheckIn(email: string) {
    try {
      const user = await User.findOne({ email: email });

      if (!user) {
        return null;
      }

      const newCheckIn = await CheckInModel.create({
        _id: user._id,
        remindIn: user.remindIn,
        lastUpdatedAt: new Date(),
      });

      return newCheckIn;
    } catch (error) {
      throw error;
    }
  }

  static async updateCheckIn(id: string) {
    try {
      const user = await User.findById(id);
      const checkIn = await User.findById(id);

      if (!user || !checkIn) return null;

      if (user.remindIn !== checkIn?.remindIn) {
        checkIn.remindIn = user.remindIn;

        await CheckInModel.findByIdAndUpdate(checkIn._id, {
          remindIn: user.remindIn,
        });
      }

      return checkIn;
    } catch (error) {
      throw error;
    }
  }

  static async checkOffuser(id: string) {
    try {
      const user = CheckInModel.findByIdAndUpdate(id, { isChecked: true }, { new: true });

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async getUsersWithoutPlans(collection: string) {
    const modelList: { [key: string]: Model<any> } = {
      [`workoutPlan`]: WorkoutPlan,
      [`dietPlan`]: DietPlan,
    };

    if (!modelList[collection]) {
      return null;
    }

    try {
      const users = await User.find({}, { firstName: 1, lastName: 1 });

      const usersWithPlans = await modelList[collection].find({}, { userId: 1 });

      const usersWithPlanSet = new Set(usersWithPlans.map((user) => user.userId.toString()));

      const usersWithoutPlan = users.filter((user) => !usersWithPlanSet.has(user._id.toString()));

      return usersWithoutPlan;
    } catch (error) {
      throw error;
    }
  }

  static async getUsersFinishingThisMonth() {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    try {
      const users = await User.find(
        {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateFinished" }, month] },
              { $eq: [{ $year: "$dateFinished" }, year] },
            ],
          },
        },
        { firstName: 1, lastName: 1 }
      );

      return users;
    } catch (error) {
      throw error;
    }
  }
}
