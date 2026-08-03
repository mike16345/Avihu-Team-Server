import { ObjectId } from "mongodb";

export interface ISet {
  minReps: number;
  maxReps: number;
}

export interface IRecordedSet {
  plan: string;
  exercise: string;
  exerciseId?: ObjectId;
  setNumber: number;
  weight: number;
  repsDone: number;
  note: string;
  date: Date;
  rir: number;
}

export type SetInputType = "wheel" | "table";
export interface IExerciseRecordedSets {
  [exercise: string]: IRecordedSet[];
}

export interface IMuscleGroupRecordedSets {
  userId: ObjectId;
  muscleGroup: string;
  recordedSets: IExerciseRecordedSets;
}
