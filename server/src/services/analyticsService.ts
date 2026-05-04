import { Model } from "mongoose";
import { DietPlan } from "../models/dietPlanModel";
import { User } from "../models/userModel";
import { WorkoutPlan } from "../models/workoutPlanModel";
import { Cache } from "../utils/cache";

const userCache = new Cache<any>();
const checkInCache = new Cache<any>();

export class AnalyticsService {
  static async getAllCheckInUsers() {
    const cachedCheckIns = checkInCache.get("all");
    if (cachedCheckIns) {
      return cachedCheckIns;
    }

    try {
      const allUsers = await User.find({ isDeleted: false, role: "user", isChecked: false }).select(
        `firstName lastName isChecked`
      );

      for (const u of allUsers) {
        // Cache the user details
        if (u) {
          userCache.set(u._id.toString());
        }
      }

      checkInCache.set("all", allUsers); // Cache the result
      return allUsers;
    } catch (error) {
      throw error;
    }
  }

  static async checkOffUser(id: string) {
    try {
      const updatedCheckIn = await User.findByIdAndUpdate(id, { isChecked: true }, { new: true });

      checkInCache.invalidate(id); // Invalidate specific check-in cache
      checkInCache.invalidate("all"); // Invalidate check-in cache

      return updatedCheckIn;
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
      const users = await User.find({ isDeleted: false, role: "user" }, { firstName: 1, lastName: 1 });
      const usersWithPlans = await modelList[collection].find({}, { userId: 1 });
      const usersWithPlanSet = new Set(usersWithPlans.map((user) => user.userId.toString()));
      const usersWithoutPlan = users.filter((user) => !usersWithPlanSet.has(user._id.toString()));

      return usersWithoutPlan;
    } catch (error) {
      throw error;
    }
  }

  static async getUsersFinishingThisMonth() {
    const cached = checkInCache.get(`usersExpiring`);
    if (cached) return cached;

    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    try {
      const users = await User.find(
        {
          isDeleted: false,
          role: "user",
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateFinished" }, month] },
              { $eq: [{ $year: "$dateFinished" }, year] },
            ],
          },
        },
        { firstName: 1, lastName: 1 }
      );

      checkInCache.set(`usersExpiring`, users);

      return users;
    } catch (error) {
      throw error;
    }
  }
}
