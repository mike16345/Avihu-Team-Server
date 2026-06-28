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
export type WorkoutLevel = "beginner" | "intermediate" | "advanced" | "pro";
export type WorkoutGoal =
  | "fat-loss"
  | "muscle-gain"
  | "strength"
  | "endurance"
  | "toning"
  | "rehab";
export type WorkoutEquipment = "gym" | "studio" | "weights" | "bodyweight" | "weights-bodyweight";

export interface IWorkoutPlanMeta {
  workoutsPerWeek?: number;
  durationMinutes?: number;
  level?: WorkoutLevel;
  goal?: WorkoutGoal;
  equipment?: WorkoutEquipment;
  muscleFocus?: string[];
  note?: string;
  limitations?: string;
  /** Sub-trainer (or main trainer) id of whoever built this plan. */
  builtByTrainerId?: string;
}

/**
 * History / temporary-swap fields. One trainee may have many docs in
 * `workoutPlans`; at most ONE has `archivedAt = null` (the active
 * plan the mobile app reads). All older docs are history with a
 * non-null archivedAt. Restore = create a new active doc cloned from
 * an archived one. See workoutPlanModel.ts for the schema.
 */
export interface IWorkoutPlanHistory {
  /** Null when this plan is currently active for the trainee. */
  archivedAt?: Date | null;
  /** Pointer to the plan that replaced this one (set when archived). */
  replacedByPlanId?: string;
  /** Trainer id who created/assigned this plan (audit trail). */
  assignedBy?: string;
  /** When this assignment became active. */
  assignedAt?: Date;
  /**
   * Optional end-date for a temporary swap. Surfaces an orange
   * banner in the trainer UI; restore is MANUAL — no cron. Pure
   * metadata, doesn't auto-mutate.
   */
  temporaryUntil?: Date;
  /** When temporary, points to the archived plan to restore to. */
  restoreToPlanId?: string;
  /** Human label shown in history ("Full-Body חודש יוני"). */
  assignmentLabel?: string;
}

export interface IFullWorkoutPlan extends IWorkoutPlanMeta, IWorkoutPlanHistory {
  userId: string;
  tips: string[];
  workoutPlans: IDetailedWorkoutPlan[];
  cardio: ICardioPlan;
  archivedAt?: Date | null;
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
