import mongoose from "mongoose";
import { USER_ACCOUNT_STATUSES } from "../models/userModel";
import { SetInputType } from "./ISet";

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[keyof typeof USER_ACCOUNT_STATUSES];

export interface StatusHistory {
  at: Date;
  kind: "system" | "manual";
  fromStatus: UserAccountStatus;
  toStatus: UserAccountStatus;
  changedBy: string;
  frozenDaysRemaining: number;
  daysAdded: number;
  note: string;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isDeleted?: boolean;
  dietaryType?: string[];
  dateJoined: Date;
  dateFinished?: Date;
  planType?: string;
  remindIn?: number;
  checkInAt?: number;
  isChecked?: boolean;
  imagesUploaded?: boolean;
  hasAccess: boolean;
  role: "admin" | "user" | "trainer" | "subTrainer";
  onboardingStep?: "form" | "agreement" | "completed";
  setInputType: SetInputType;
  isAdmin: boolean;
  profileImage?: string;
  trainerId?: mongoose.Types.ObjectId;
  subTrainerId?: mongoose.Types.ObjectId;
  accountStatus: UserAccountStatus;
  frozenAt?: Date;
  frozenDaysRemaining?: number;
  statusHistory: StatusHistory;
}
