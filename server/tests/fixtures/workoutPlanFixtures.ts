export const ValidSet = {
  minReps: 8,
  maxReps: 12,
};

export const InvalidSet = {
  maxReps: 12,
};

export const ValidWorkout = {
  name: "Bench Press",
  sets: [ValidSet],
  linkToVideo: "http://example.com/benchpress",
  tipFromTrainer: "Keep your back flat on the bench.",
};

export const InvalidWorkout = {
  sets: [ValidSet],
};

export const ValidMuscleGroupWorkoutPlan = {
  muscleGroup: "Chest",
  exercises: [ValidWorkout],
};

export const InvalidMuscleGroupWorkoutPlan = {
  muscleGroup: "Chest",
  exercises: [],
};

export const ValidWorkoutPlan = {
  planName: "Beginner Plan",
  userId: "1",
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const InvalidWorkoutPlan = {
  planName: "This plan name is way too long and exceeds the maximum allowed length",
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const ValidDetailedWorkoutPlan = {
  planName: "Beginner Plan",
  userId: "1",
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const InvalidDetailedWorkoutPlan = {
  planName: "This plan name is way too long and exceeds the maximum allowed length",
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const all = {
  planName: "Beginner Plan",
  userId: "1",
  workouts: [
    {
      muscleGroup: "Chest",
      workouts: [
        {
          name: "Bench Press",
          sets: [{ minReps: 8, maxReps: 12 }],
          linkToVideo: "http://example.com/benchpress",
          tipFromTrainer: "Keep your back flat on the bench.",
        },
      ],
    },
  ],
};
