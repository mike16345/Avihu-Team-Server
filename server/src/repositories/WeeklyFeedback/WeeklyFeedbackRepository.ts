import { IWeeklyFeedback, IWeeklyFeedbackPayload } from "../../interfaces/IWeeklyFeedback";
import { WeeklyFeedback } from "../../models/weeklyFeedbackModel";
import { BaseRepository } from "../BaseRepository";

const toSundayUtc = (input: string | Date): Date => {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
};

const toSaturdayUtc = (weekStart: Date): Date => {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

export default class WeeklyFeedbackRepository extends BaseRepository<IWeeklyFeedback> {
  constructor() {
    super(WeeklyFeedback, { type: "global" });
  }

  upsertForWeek = async (
    userId: string,
    payload: IWeeklyFeedbackPayload
  ): Promise<IWeeklyFeedback> => {
    const now = new Date();
    const weekStart = toSundayUtc(payload.weekStart);
    const weekEnd = toSaturdayUtc(weekStart);
    const doc = await this.model.findOneAndUpdate(
      { userId, weekStart },
      {
        $set: {
          userId,
          weekStart,
          weekEnd,
          workouts: payload.workouts,
          nutrition: payload.nutrition,
          weighIns: payload.weighIns.map((w) => ({ date: new Date(w.date), weight: w.weight })),
          sleepHours: payload.sleepHours,
          cardioMinutes: payload.cardioMinutes,
          cardioMinutesGoal: payload.cardioMinutesGoal,
          steps: payload.steps,
          feedbackText: payload.feedbackText,
          finalized: payload.finalized,
          updatedAt: now,
        },
        $setOnInsert: { submittedAt: now },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return doc;
  };

  findByUserId = async (userId: string, limit?: number): Promise<IWeeklyFeedback[]> => {
    const query = this.model.find({ userId }).sort({ weekStart: -1 });
    if (limit && limit > 0) query.limit(limit);

    return await query.exec();
  };

  findOneByWeek = async (
    userId: string,
    weekStart: string
  ): Promise<IWeeklyFeedback | null> => {
    return await this.model.findOne({ userId, weekStart: toSundayUtc(weekStart) }).exec();
  };
}
