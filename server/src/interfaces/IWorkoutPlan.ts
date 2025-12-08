import { Types } from "mongoose";
import { ISet } from "./ISet";

export interface IMuscleGroupWorkoutPlan {
  muscleGroup: string;
  exercises: IExercise[];
}

export interface IExercise {
  exerciseId: Types.ObjectId;
  tipFromTrainer?: string;
  exerciseMethod?: string;
  linkToVideo?: string;
  name?: string;
  sets: ISet[];
  restTime: number;
  imageUrl?: string;
}

export interface IExercisePreset extends Omit<IExercise, "sets" | "restTime" | "exerciseMethod"> {
  muscleGroup: string;
}

export interface IDetailedWorkoutPlan {
  planName: string;
  muscleGroups: IMuscleGroupWorkoutPlan[];
}

export interface IFullWorkoutPlan {
  userId: string;
  tips: string[];
  workoutPlans: IDetailedWorkoutPlan[];
  cardio: ICardioPlan;
}

export interface ICardioPlan {
  type: `simple` | `complex`;
  plan: IComplexCardioType | ISimpleCardioType;
}

export interface ISimpleCardioType {
  minsPerWeek: number;
  timesPerWeek: number;
  minsPerWorkout?: number;
  tips?: string;
}

export interface ICardioWorkout {
  name: string;
  warmUpAmount?: number;
  distance: string;
  cardioExercise: string;
  tips?: string;
}

export interface ICardioWeek {
  week: string;
  workouts: ICardioWorkout[];
}
export interface IComplexCardioType {
  weeks: ICardioWeek[];
  tips?: string;
}

export interface IExercisePlanPreset extends Omit<IFullWorkoutPlan, "userId"> {
  name: string;
}

export interface IExerciseMethod {
  title: string;
  description: string;
}

export interface ICardioWorkout {
  name: string;
}
export interface IMuscleGroup {
  name: string;
}
