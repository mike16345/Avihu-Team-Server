import { ObjectId } from "mongodb";

export interface IWeeklyFeedbackWorkout {
  planId: string;
  doneSmart: boolean;
  doneManual: boolean;
}

export interface IWeeklyFeedbackWeighIn {
  date: Date;
  weight: number;
}

export interface IWeeklyFeedbackNutrition {
  daysCompleted: string[];
  dayNotes: Record<string, string>;
}

export interface IWeeklyFeedback {
  _id?: ObjectId;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  workouts: IWeeklyFeedbackWorkout[];
  nutrition: IWeeklyFeedbackNutrition;
  weighIns: IWeeklyFeedbackWeighIn[];
  sleepHours: number | null;
  cardioMinutes: number | null;
  steps: number | null;
  feedbackText: string;
  finalized: boolean;
  submittedAt: Date;
  updatedAt: Date;
}

export interface IWeeklyFeedbackPayload {
  weekStart: string;
  weekEnd: string;
  workouts: IWeeklyFeedbackWorkout[];
  nutrition: IWeeklyFeedbackNutrition;
  weighIns: { date: string; weight: number }[];
  sleepHours: number | null;
  cardioMinutes: number | null;
  steps: number | null;
  feedbackText: string;
  finalized: boolean;
}
