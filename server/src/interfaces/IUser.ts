import mongoose from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  isAdmin: boolean;
  profileImage?: string;
  trainerId?: mongoose.Types.ObjectId;
  subTrainerId?: mongoose.Types.ObjectId;
}
