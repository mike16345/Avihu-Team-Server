export interface ISet {
  minReps: number;
  maxReps: number;
}

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
