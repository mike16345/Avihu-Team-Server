import { Types } from "mongoose";
import { ISet } from "./ISet";

export const EXERCISE_LIBRARY_SCOPES = ["private", "system"] as const;
export type ExerciseLibraryScope = (typeof EXERCISE_LIBRARY_SCOPES)[number];

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

export interface IExercisePreset extends Omit<
  IExercise,
  "sets" | "restTime" | "exerciseMethod" | "exerciseId"
> {
  _id?: Types.ObjectId;
  trainerId?: Types.ObjectId;
  muscleGroup: string;
  libraryScope?: ExerciseLibraryScope;
  sourceExerciseId?: Types.ObjectId;
  sourceOwnerId?: Types.ObjectId;
}

export interface IDetailedWorkoutPlan {
  planName: string;
  muscleGroups: IMuscleGroupWorkoutPlan[];
}

/**
 * Optional trainer-tagged meta-data for a workout plan or preset.
 * Used by the admin panel to surface filters (frequency, level,
 * goal, equipment, focus). All fields are optional — older records
 * without tagging keep working unchanged.
 */
export type WorkoutLevel = "beginner" | "intermediate" | "advanced";
export type WorkoutGoal =
  | "fat-loss"
  | "muscle-gain"
  | "strength"
  | "endurance"
  | "toning"
  | "rehab";
export type WorkoutEquipment = "gym" | "studio" | "weights" | "bodyweight";

export interface IWorkoutPlanMeta {
  workoutsPerWeek?: number;
  durationMinutes?: number;
  level?: WorkoutLevel;
  goal?: WorkoutGoal;
  equipment?: WorkoutEquipment;
  muscleFocus?: string[];
  note?: string;
  limitations?: string;
}

export interface IFullWorkoutPlan extends IWorkoutPlanMeta {
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

export interface IMuscleGroup {
  name: string;
}
