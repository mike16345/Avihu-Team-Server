import { ObjectId } from "mongoose";

export type ProgressOptions = 25 | 50 | 75 | 100;

export interface IProgressNote {
  _id?: ObjectId;
  date: Date;
  trainer: string;
  diet?: ProgressOptions;
  workouts?: ProgressOptions;
  cardio?: ProgressOptions;
  content: string;
}

export interface IProgressNotes {
  _id?: ObjectId;
  userId: ObjectId;
  progressNotes: IProgressNote[];
}
