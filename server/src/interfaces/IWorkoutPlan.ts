import { ISet } from "./ISet";

export interface IMuscleGroupWorkoutPlan {
  muscleGroup: string;
  exercises: IWorkout[];
}

export interface IWorkout {
  tipFromTrainer?: string;
  linkToVideo?: string;
  name: string;
  sets: ISet[];
}

export interface IDetailedWorkoutPlan {
  planName: string;
  userId: string;
  workouts: IMuscleGroupWorkoutPlan[];
}

export interface IFullWorkoutPlan {
  userId: string;
  workoutPlans: IDetailedWorkoutPlan[];
}

export interface IWorkoutPlanPreset {
  presetName: string;
  workoutPlans: IDetailedWorkoutPlan[];
}
