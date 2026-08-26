import { IWeeklyFeedback, IWeeklyFeedbackPayload } from "../../interfaces/IWeeklyFeedback";
import { WeeklyFeedback } from "../../models/weeklyFeedbackModel";
import { BaseRepository } from "../BaseRepository";

export default class WeeklyFeedbackRepository extends BaseRepository<IWeeklyFeedback> {
  constructor() {
    super(WeeklyFeedback, { type: "global" });
  }

  upsertForWeek = async (
    userId: string,
    payload: IWeeklyFeedbackPayload
  ): Promise<IWeeklyFeedback> => {
    const now = new Date();
    const doc = await this.model.findOneAndUpdate(
      { userId, weekStart: new Date(payload.weekStart) },
      {
        $set: {
          userId,
          weekStart: new Date(payload.weekStart),
          weekEnd: new Date(payload.weekEnd),
          workouts: payload.workouts,
          nutrition: payload.nutrition,
          weighIns: payload.weighIns.map((w) => ({ date: new Date(w.date), weight: w.weight })),
          sleepHours: payload.sleepHours,
          cardioMinutes: payload.cardioMinutes,
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
    return await this.model.findOne({ userId, weekStart: new Date(weekStart) }).exec();
  };
}
