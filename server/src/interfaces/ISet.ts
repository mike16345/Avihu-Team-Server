import { ObjectId } from "mongodb";

export interface ISet {
  minReps: number;
  maxReps: number;
}

export interface IRecordedSet {
  plan: string;
  exercise: string;
  setNumber: number;
  weight: number;
  repsDone: number;
  note: string;
  date: Date;
}

export interface IExerciseRecordedSets {
  [exercise: string]: IRecordedSet[];
}

export interface IMuscleGroupRecordedSets {
  userId: ObjectId;
  muscleGroup: string;
  recordedSets: IExerciseRecordedSets;
}
