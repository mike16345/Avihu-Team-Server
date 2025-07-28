import {
  IFullWorkoutPlan,
  IDetailedWorkoutPlan,
  IMuscleGroupWorkoutPlan,
  IExercise,
} from "../interfaces/IWorkoutPlan";

export async function sanitizeWorkoutPlanForInsert(
  workoutPlan: IFullWorkoutPlan
): Promise<IFullWorkoutPlan> {
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
  const { name, linkToVideo, ...rest } = exercise;

  return {
    ...rest,
  };
}
