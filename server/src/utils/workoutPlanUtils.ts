import {
  IFullWorkoutPlan,
  IDetailedWorkoutPlan,
  IMuscleGroupWorkoutPlan,
  IExercise,
  ICardioPlan,
  ISimpleCardioType,
} from "../interfaces/IWorkoutPlan";
import { IWorkoutPlanPreset } from "../models/workoutPlanPresetModel";

export function sanitizeCardioPlan(cardio: ICardioPlan): ICardioPlan {
  if (cardio.type === "simple") {
    const { weeks, ...rest } = cardio.plan as ISimpleCardioType & { weeks?: any };
    return {
      type: "simple",
      plan: rest,
    };
  }

  return cardio;
}

export function sanitizeWorkoutPlanForInsert(
  workoutPlan: IFullWorkoutPlan | IWorkoutPlanPreset
): IFullWorkoutPlan | IWorkoutPlanPreset {
  const sanitizedPlans = workoutPlan.workoutPlans.map(sanitizeWorkoutPlan);
  const sanitizedCardio = sanitizeCardioPlan(workoutPlan.cardio);

  return {
    ...workoutPlan,
    workoutPlans: sanitizedPlans,
    cardio: sanitizedCardio,
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
  const { name, linkToVideo, exerciseId, tipFromTrainer, ...rest } = exercise;

  return {
    ...rest,
    exerciseId: typeof exerciseId === "object" && exerciseId !== null ? exerciseId._id : exerciseId,
  };
}
