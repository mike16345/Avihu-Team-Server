import { RagCacheRepository } from "../repositories/Rag/RagCacheRepository";
import { RagTraceRepository } from "../repositories/Rag/RagTraceRepository";
import { RagRateLimitRepository } from "../repositories/Rag/RagRateLimitRepository";
import { RagSourceRepository } from "../repositories/Rag/RagSourceRepository";
import RagDailyQuotaModel from "../models/ragDailyQuotaModel";
import SystemStatusModel from "../models/systemStatusModel";

const ragCacheRepository = new RagCacheRepository();
const ragTraceRepository = new RagTraceRepository();
const ragRateLimitRepository = new RagRateLimitRepository();
const ragSourceRepository = new RagSourceRepository();

export const getRagCacheRepository = () => ragCacheRepository;
export const getRagTraceRepository = () => ragTraceRepository;
export const getRagRateLimitRepository = () => ragRateLimitRepository;
export const getRagSourceRepository = () => ragSourceRepository;

export function getRagDailyQuotaRepository() {
  return {
    async incAndGet({ userId, date }: { userId: string; date: string }) {
      const now = new Date();
      const doc = await RagDailyQuotaModel.findOneAndUpdate(
        { userId, date },
        { $inc: { count: 1 }, $set: { updatedAt: now } },
        { new: true, upsert: true }
      ).lean();
      return doc;
    },
    async get({ userId, date }: { userId: string; date: string }) {
      return RagDailyQuotaModel.findOne({ userId, date }).lean();
    },
  };
}

let _cachedStatus: { paused: boolean; message?: string; ts: number } | null = null;
const STATUS_TTL_MS = 60_000;

export function getSystemStatusRepository() {
  return {
    async get(): Promise<{ paused: boolean; message?: string }> {
      const now = Date.now();
      if (_cachedStatus && now - _cachedStatus.ts < STATUS_TTL_MS) {
        return { paused: _cachedStatus.paused, message: _cachedStatus.message };
      }
      const doc = await SystemStatusModel.findOne({ key: "system" }).lean();
      const res = { paused: !!doc?.paused, message: doc?.message || "" };
      _cachedStatus = { ...res, ts: now };
      return res;
    },
    async setPaused(paused: boolean, message = "") {
      const now = new Date();
      await SystemStatusModel.findOneAndUpdate(
        { key: "system" },
        { $set: { paused, message, updatedAt: now } },
        { upsert: true }
      );
      _cachedStatus = { paused, message, ts: Date.now() };
    },
    async clearCache() {
      _cachedStatus = null;
    },
  };
}
