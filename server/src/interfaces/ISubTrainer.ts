import mongoose from "mongoose";

export const SUB_TRAINER_POSITIONS = ["מאמן", "תזונאי", "יועץ תזונה", "אחר"] as const;
export const SUB_TRAINER_STATUSES = ["active", "inactive"] as const;

export type SubTrainerPosition = (typeof SUB_TRAINER_POSITIONS)[number];
export type SubTrainerStatus = (typeof SUB_TRAINER_STATUSES)[number];

export interface ISubTrainer {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  position: SubTrainerPosition;
  status: SubTrainerStatus;
  trainerId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
