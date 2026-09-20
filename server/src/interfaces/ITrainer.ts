import mongoose from "mongoose";

export const TRAINER_SUBSCRIPTION_PLANS = ["Pro", "בסיסי"] as const;
export const TRAINER_STATUSES = ["active", "inactive", "blocked"] as const;
export const TRAINER_DIET_PLAN_VERSIONS = [1, 2] as const;
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
export type TrainerDietPlanVersion = (typeof TRAINER_DIET_PLAN_VERSIONS)[number];
export type TrainerSource = (typeof TRAINER_SOURCES)[number];

export interface ITrainer {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  isDeleted?: boolean;
  traineeCount?: number;
  subTrainerCount?: number;
  subscriptionPlan: TrainerSubscriptionPlan;
  clientLimit: number;
  subTrainerLimit: number;
  status: TrainerStatus;
  source: TrainerSource;
  videoLibraryAccess: boolean;
  dietPlanVersion: TrainerDietPlanVersion;
  userId?: mongoose.Types.ObjectId;
  /**
   * IDs of workout presets the trainer has starred as favourites.
   * Float to top of grid + filterable via the "מועדפים" chip.
   */
  favoriteWorkoutPresetIds?: mongoose.Types.ObjectId[];
  favoriteDietPresetIds?: mongoose.Types.ObjectId[];
  /**
   * When true, sub-trainers under this head trainer see the same
   * favourites (read-only "team favourites"). Off by default —
   * favourites are a personal tool until opt-in to sharing.
   */
  sharesFavorites?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
