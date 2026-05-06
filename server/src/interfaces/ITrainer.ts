import mongoose from "mongoose";

export const TRAINER_SUBSCRIPTION_PLANS = ["Pro", "בסיסי"] as const;
export const TRAINER_STATUSES = ["active", "inactive", "blocked"] as const;
export const TRAINER_SOURCES = [
  "פנייה קרה",
  "יוטיוב",
  "גוגל",
  "פייסבוק",
  "אינסטגרם",
  "פה לאוזן",
] as const;

export type TrainerSubscriptionPlan = (typeof TRAINER_SUBSCRIPTION_PLANS)[number];
export type TrainerStatus = (typeof TRAINER_STATUSES)[number];
export type TrainerSource = (typeof TRAINER_SOURCES)[number];

export interface ITrainer {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  isDeleted?: boolean;
  subscriptionPlan: TrainerSubscriptionPlan;
  clientLimit: number;
  subTrainerLimit: number;
  status: TrainerStatus;
  source: TrainerSource;
  videoLibraryAccess: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
