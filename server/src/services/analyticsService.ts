import { Model } from "mongoose";
import { CheckInModel } from "../models/checkInModel";
import { DietPlan } from "../models/dietPlanModel";
import { User } from "../models/userModel";
import { Cache } from "../utils/cache";
import { WorkoutPlan } from "../models/workoutPlanModel";

const userCache = new Cache<any>();
const checkInCache = new Cache<any>();

export class AnalyticsService {
  static async getAllCheckInUsers() {
    const cachedCheckIns = checkInCache.get("all");
    if (cachedCheckIns) {
      return cachedCheckIns;
    }

    try {
      const allUsers = await CheckInModel.find({ isChecked: false });
      const users = [];

      for (const u of allUsers) {
        const user =
          userCache.get(u._id.toString()) ||
          (await User.findById(u._id).select(`firstName lastName`));

        // Cache the user details
        if (user) {
          userCache.set(u._id.toString(), user);
          users.push({
            isChecked: u.isChecked,
            _id: u._id,
            firstName: user?.firstName,
            lastName: user?.lastName,
          });
        }
      }

      checkInCache.set("all", users); // Cache the result
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

      checkInCache.invalidate(String(user._id)); // Invalidate user cache
      checkInCache.invalidate("all"); // Invalidate check-in cache

      return newCheckIn;
    } catch (error) {
      throw error;
    }
  }

  static async updateCheckIn(id: string) {
    try {
      const user = await User.findById(id);
      const checkIn = await CheckInModel.findById(id);

      if (!user || !checkIn) return null;

      if (user.remindIn !== checkIn.remindIn) {
        checkIn.remindIn = user.remindIn;

        await CheckInModel.findByIdAndUpdate(checkIn._id, {
          remindIn: user.remindIn,
        });

        checkInCache.invalidate(id); // Invalidate specific check-in cache
        checkInCache.invalidate("all"); // Invalidate check-in cache
      }

      return checkIn;
    } catch (error) {
      throw error;
    }
  }

  static async checkOffUser(id: string) {
    try {
      const updatedCheckIn = await CheckInModel.findByIdAndUpdate(
        id,
        { isChecked: true },
        { new: true }
      );

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

    const cached = checkInCache.get(`${collection}/users/plans`);

    if (cached) return cached;
    try {
      const users = await User.find({}, { firstName: 1, lastName: 1 });
      const usersWithPlans = await modelList[collection].find({}, { userId: 1 });
      const usersWithPlanSet = new Set(usersWithPlans.map((user) => user.userId.toString()));
      const usersWithoutPlan = users.filter((user) => !usersWithPlanSet.has(user._id.toString()));

      checkInCache.set(`${collection}/users/plans`, usersWithoutPlan);
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
