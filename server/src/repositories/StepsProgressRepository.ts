import { IStepsProgress } from "../interfaces/IStepsProgress";
import { StepsProgress } from "../models/stepsProgressModel";
import { BaseRepository } from "./BaseRepository";

export class StepsProgressRepository extends BaseRepository<IStepsProgress> {
  constructor() {
    super(StepsProgress, { type: "global" });
  }

  upsertDailyProgress = async (progress: IStepsProgress) => {
    return this.model
      .findOneAndUpdate(
        { userId: progress.userId, date: progress.date },
        { $set: progress },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      .lean()
      .exec();
  };

  findDailyProgress = async (userId: string, date: string) => {
    const progress = await this.model.findOne({ userId, date }).lean().exec();

    return progress as IStepsProgress | null;
  };

  findByUserAndDateRange = async (userId: string, from?: string, to?: string) => {
    const dateQuery: Record<string, string> = {};
    if (from) {
      dateQuery.$gte = from;
    }
    if (to) {
      dateQuery.$lte = to;
    }

    const query = {
      userId,
      ...(Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {}),
    };

    return this.model.find(query).sort({ date: 1 }).lean().exec();
  };
}

export const stepsProgressRepository = new StepsProgressRepository();
