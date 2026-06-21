import {
  IFullWorkoutPlan,
  IDetailedWorkoutPlan,
  IMuscleGroupWorkoutPlan,
  IExercise,
  ICardioPlan,
  ISimpleCardioType,
} from "../interfaces/IWorkoutPlan";
import { Types } from "mongoose";
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
    exerciseId: normalizeExerciseId(exerciseId) as IExercise["exerciseId"],
  };
}

function normalizeExerciseId(exerciseId: unknown): unknown {
  if (!exerciseId) return exerciseId;
  if (typeof exerciseId === "string") return exerciseId;

  if (exerciseId instanceof Types.ObjectId) {
    return exerciseId.toHexString();
  }

  if (typeof exerciseId !== "object") return exerciseId;

  const value = exerciseId as {
    _id?: unknown;
    buffer?: unknown;
    toHexString?: () => string;
  };

  if (typeof value.toHexString === "function") {
    return value.toHexString();
  }

  if (value._id) {
    return normalizeExerciseId(value._id);
  }

  const bytes = extractObjectIdBytes(value.buffer);
  if (bytes) {
    return new Types.ObjectId(Buffer.from(bytes)).toHexString();
  }

  return exerciseId;
}

function extractObjectIdBytes(bufferLike: unknown): number[] | null {
  if (!bufferLike) return null;

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(bufferLike)) {
    return bufferLike.length === 12 ? Array.from(bufferLike) : null;
  }

  if (Array.isArray(bufferLike)) {
    return isObjectIdByteArray(bufferLike) ? bufferLike : null;
  }

  if (typeof bufferLike !== "object") return null;

  const bytes = Object.entries(bufferLike as Record<string, unknown>)
    .filter(([key]) => /^\d+$/.test(key))
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, value]) => Number(value));

  return isObjectIdByteArray(bytes) ? bytes : null;
}

function isObjectIdByteArray(value: number[]): value is number[] {
  return (
    value.length === 12 &&
    value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  );
}
