import {
  IFullWorkoutPlan,
  IDetailedWorkoutPlan,
  IMuscleGroupWorkoutPlan,
  IExercise,
} from "../interfaces/IWorkoutPlan";
import { IWorkoutPlanPreset } from "../models/workoutPlanPresetModel";

export function sanitizeWorkoutPlanForInsert(
  workoutPlan: IFullWorkoutPlan | IWorkoutPlanPreset
): IFullWorkoutPlan | IWorkoutPlanPreset {
  const sanitizedPlans = workoutPlan.workoutPlans.map(sanitizeWorkoutPlan);

  return {
    ...workoutPlan,
    workoutPlans: sanitizedPlans,
  };
}

function sanitizeWorkoutPlan(plan: IDetailedWorkoutPlan) {
  const sanitizedGroups = plan.muscleGroups.map(sanitizeMuscleGroup);

  return {
    ...plan,
    muscleGroups: sanitizedGroups,
  };
}

function sanitizeMuscleGroup(group: IMuscleGroupWorkoutPlan) {
  const sanitizedExercises = group.exercises.map(sanitizeExercise);

  return {
    ...group,
    exercises: sanitizedExercises,
  };
}

function sanitizeExercise(exercise: IExercise) {
  const { name, linkToVideo, exerciseId, ...rest } = exercise;

  return {
    ...rest,
    exerciseId: typeof exerciseId === "object" && exerciseId !== null ? exerciseId._id : exerciseId,
  };
}
