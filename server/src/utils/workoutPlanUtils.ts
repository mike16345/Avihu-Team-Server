import {
  IFullWorkoutPlan,
  IDetailedWorkoutPlan,
  IMuscleGroupWorkoutPlan,
  IExercise,
} from "../interfaces/IWorkoutPlan";
import { IWorkoutPlanPreset } from "../models/workoutPlanPresetModel";

export async function sanitizeWorkoutPlanForInsert(
  workoutPlan: IFullWorkoutPlan | IWorkoutPlanPreset
): Promise<IFullWorkoutPlan | IWorkoutPlanPreset> {
  const sanitizedPlans = await Promise.all(workoutPlan.workoutPlans.map(sanitizeWorkoutPlan));

  return {
    ...workoutPlan,
    workoutPlans: sanitizedPlans,
  };
}

async function sanitizeWorkoutPlan(plan: IDetailedWorkoutPlan) {
  const sanitizedGroups = await Promise.all(plan.muscleGroups.map(sanitizeMuscleGroup));

  return {
    ...plan,
    muscleGroups: sanitizedGroups,
  };
}

async function sanitizeMuscleGroup(group: IMuscleGroupWorkoutPlan) {
  const sanitizedExercises = await Promise.all(group.exercises.map(sanitizeExercise));

  return {
    ...group,
    exercises: sanitizedExercises,
  };
}

async function sanitizeExercise(exercise: IExercise) {
  const { name, linkToVideo, exerciseId, ...rest } = exercise;
  if (exerciseId.linkToVideo) {
    delete exerciseId.linkToVideo;
  }

  if (exerciseId.name) {
    delete exerciseId.name;
  }

  return {
    ...rest,
    exerciseId,
  };
}
