import moment from "moment";
import { Model, Types } from "mongoose";
import { TRAINER_SOURCES } from "../interfaces/ITrainer";
import { DietPlan } from "../models/dietPlanModel";
import { TrainerModel } from "../models/trainerModel";
import { User } from "../models/userModel";
import { WorkoutPlan } from "../models/workoutPlanModel";
import { Cache } from "../utils/cache";
import { requireTrainerAuthContext } from "../utils/authContext";

const userCache = new Cache<any>();
const checkInCache = new Cache<any>();

type DashboardMetric = {
  total: number;
  currentMonthAdded: number;
  previousMonthAdded: number;
  trendCount: number;
  trendPercentage: number;
};

type SourceRangeInput = {
  from: string;
  to: string;
};

const buildTrendPercentage = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const buildDashboardMetric = (
  total: number,
  currentMonthAdded: number,
  previousMonthAdded: number
) => {
  return {
    total,
    currentMonthAdded,
    previousMonthAdded,
    trendCount: currentMonthAdded - previousMonthAdded,
    trendPercentage: buildTrendPercentage(currentMonthAdded, previousMonthAdded),
  };
};

const getCurrentAndPreviousMonthRanges = () => {
  const currentMonthStart = moment().startOf("month");
  const nextMonthStart = currentMonthStart.clone().add(1, "month");
  const previousMonthStart = currentMonthStart.clone().subtract(1, "month");

  return {
    currentMonthStart: currentMonthStart.toDate(),
    nextMonthStart: nextMonthStart.toDate(),
    previousMonthStart: previousMonthStart.toDate(),
  };
};

export class AnalyticsService {
  static async getAllCheckInUsers() {
    const { trainerId } = requireTrainerAuthContext();

    const cachkey = `all-${trainerId}`;

    const cachedCheckIns = checkInCache.get(cachkey);
    if (cachedCheckIns) {
      return cachedCheckIns;
    }

    try {
      const allUsers = await User.find({
        isDeleted: false,
        role: "user",
        isChecked: false,
        trainerId,
      }).select(`firstName lastName isChecked`);

      for (const u of allUsers) {
        if (u) {
          userCache.set(u._id.toString());
        }
      }

      checkInCache.set(cachkey, allUsers);
      return allUsers;
    } catch (error) {
      throw error;
    }
  }

  static async checkOffUser(id: string) {
    try {
      const updatedCheckIn = await User.findByIdAndUpdate(id, { isChecked: true }, { new: true });

      checkInCache.invalidate(id);
      checkInCache.invalidate("all");

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

    const { trainerId } = requireTrainerAuthContext();

    try {
      const users = await User.find(
        { isDeleted: false, role: "user", trainerId },
        { firstName: 1, lastName: 1 }
      );
      const usersWithPlans = await modelList[collection].find({}, { userId: 1 });
      const usersWithPlanSet = new Set(usersWithPlans.map((user) => user.userId.toString()));
      const usersWithoutPlan = users.filter((user) => !usersWithPlanSet.has(user._id.toString()));

      return usersWithoutPlan;
    } catch (error) {
      throw error;
    }
  }

  static async getUsersFinishingThisMonth() {
    const { trainerId } = requireTrainerAuthContext();

    const cachekey = `usersExpiring-${trainerId}`;
    const cached = checkInCache.get(cachekey);
    if (cached) return cached;

    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    try {
      const users = await User.find(
        {
          isDeleted: false,
          role: "user",
          trainerId,
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateFinished" }, month] },
              { $eq: [{ $year: "$dateFinished" }, year] },
            ],
          },
        },
        { firstName: 1, lastName: 1 }
      );

      checkInCache.set(cachekey, users);

      return users;
    } catch (error) {
      throw error;
    }
  }

  static async getDashboardSummary() {
    const { currentMonthStart, nextMonthStart, previousMonthStart } =
      getCurrentAndPreviousMonthRanges();

    const [
      activeTrainersTotal,
      activeTrainersCurrentMonth,
      activeTrainersPreviousMonth,
      usersTotal,
      usersCurrentMonth,
      usersPreviousMonth,
      trainersCurrentMonth,
      trainersPreviousMonth,
    ] = await Promise.all([
      TrainerModel.countDocuments({ isDeleted: false, status: "active" }),
      TrainerModel.countDocuments({
        isDeleted: false,
        status: "active",
        createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
      }),
      TrainerModel.countDocuments({
        isDeleted: false,
        status: "active",
        createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
      }),
      User.countDocuments({ isDeleted: false, role: "user" }),
      User.countDocuments({
        isDeleted: false,
        role: "user",
        dateJoined: { $gte: currentMonthStart, $lt: nextMonthStart },
      }),
      User.countDocuments({
        isDeleted: false,
        role: "user",
        dateJoined: { $gte: previousMonthStart, $lt: currentMonthStart },
      }),
      TrainerModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
      }),
      TrainerModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
      }),
    ]);

    const joinedThisMonthCurrent = trainersCurrentMonth + usersCurrentMonth;
    const joinedThisMonthPrevious = trainersPreviousMonth + usersPreviousMonth;

    return {
      activeTrainers: buildDashboardMetric(
        activeTrainersTotal,
        activeTrainersCurrentMonth,
        activeTrainersPreviousMonth
      ),
      joinedThisMonth: {
        ...buildDashboardMetric(
          joinedThisMonthCurrent,
          joinedThisMonthCurrent,
          joinedThisMonthPrevious
        ),
        breakdown: {
          trainers: trainersCurrentMonth,
          users: usersCurrentMonth,
        },
      },
      appUsers: buildDashboardMetric(usersTotal, usersCurrentMonth, usersPreviousMonth),
    };
  }

  static async getDashboardSources({ from, to }: SourceRangeInput) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new Error("Invalid date range");
    }

    if (fromDate > toDate) {
      throw new Error('"from" must be before or equal to "to"');
    }

    const inclusiveToDate = moment(toDate).endOf("day").toDate();

    const sourceCounts = await TrainerModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: fromDate,
            $lte: inclusiveToDate,
          },
        },
      },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsBySource = new Map(sourceCounts.map((item) => [item._id, item.count]));
    const total = sourceCounts.reduce((sum, item) => sum + item.count, 0);

    return {
      range: {
        from: fromDate,
        to: inclusiveToDate,
      },
      total,
      items: TRAINER_SOURCES.map((source) => {
        const count = countsBySource.get(source) || 0;

        return {
          source,
          count,
          percentage: total === 0 ? 0 : Number(((count / total) * 100).toFixed(2)),
        };
      }),
    };
  }

  static async getDashboardJoinedByMonth(year: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
      throw new Error("Invalid year");
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const [trainerCounts, userCounts] = await Promise.all([
      TrainerModel.aggregate<{ _id: number; count: number }>([
        {
          $match: {
            isDeleted: false,
            createdAt: {
              $gte: yearStart,
              $lt: yearEnd,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate<{ _id: number; count: number }>([
        {
          $match: {
            isDeleted: false,
            role: "user",
            dateJoined: {
              $gte: yearStart,
              $lt: yearEnd,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$dateJoined" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const trainerCountsByMonth = new Map(trainerCounts.map((item) => [item._id, item.count]));
    const userCountsByMonth = new Map(userCounts.map((item) => [item._id, item.count]));

    return {
      year,
      buckets: Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;

        return {
          month,
          trainers: trainerCountsByMonth.get(month) || 0,
          users: userCountsByMonth.get(month) || 0,
        };
      }),
    };
  }

  static async getDashboardTrainersCloseToLimit() {
    const trainers = await TrainerModel.aggregate<{
      _id: Types.ObjectId;
      fullName: string;
      email: string;
      subscriptionPlan: string;
      clientLimit: number;
      traineeCount: number;
      utilizationPercentage: number;
    }>([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { trainerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$trainerId", "$$trainerId"] },
                    { $eq: ["$role", "user"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "traineeCounts",
        },
      },
      {
        $addFields: {
          traineeCount: {
            $ifNull: [{ $arrayElemAt: ["$traineeCounts.count", 0] }, 0],
          },
        },
      },
      {
        $addFields: {
          utilizationPercentage: {
            $cond: [
              { $gt: ["$clientLimit", 0] },
              {
                $multiply: [{ $divide: ["$traineeCount", "$clientLimit"] }, 100],
              },
              0,
            ],
          },
        },
      },
      {
        $match: {
          utilizationPercentage: { $gt: 80 },
        },
      },
      {
        $sort: {
          utilizationPercentage: -1,
          traineeCount: -1,
          createdAt: 1,
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          subscriptionPlan: 1,
          clientLimit: 1,
          traineeCount: 1,
          utilizationPercentage: { $round: ["$utilizationPercentage", 2] },
        },
      },
    ]);

    return trainers;
  }
}
