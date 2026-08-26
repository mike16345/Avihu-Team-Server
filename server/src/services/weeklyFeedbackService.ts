import { IWeeklyFeedback, IWeeklyFeedbackPayload } from "../interfaces/IWeeklyFeedback";
import { BaseService } from "./baseService";
import WeeklyFeedbackRepository from "../repositories/WeeklyFeedback/WeeklyFeedbackRepository";

export default class WeeklyFeedbackService extends BaseService<
  IWeeklyFeedback,
  WeeklyFeedbackRepository
> {
  constructor() {
    super(new WeeklyFeedbackRepository(), "weeklyFeedback");
  }

  async upsertForWeek(userId: string, payload: IWeeklyFeedbackPayload) {
    const doc = await this.repository.upsertForWeek(userId, payload);
    this.cache.invalidateAllContaining(userId);

    return doc;
  }

  async getByUserId(userId: string, limit?: number) {
    const cacheKey = this.generateCacheKey("list", `${userId}:${limit ?? "all"}`);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const docs = await this.repository.findByUserId(userId, limit);
    this.cache.set(cacheKey, docs);

    return docs;
  }

  async getByWeek(userId: string, weekStart: string) {
    return await this.repository.findOneByWeek(userId, weekStart);
  }
}
