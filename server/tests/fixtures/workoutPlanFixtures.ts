export const ValidSet = {
  minReps: 8,
  maxReps: 12,
};

export const InvalidSet = {
  minReps: -1,
};

export const ValidWorkout = {
  name: "Push Up",
  sets: [ValidSet],
  linkToVideo: "http://example.com",
  tipFromTrainer: "Keep your back straight.",
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
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const InvalidWorkoutPlan = {
  planName: "",
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const ValidDetailedWorkoutPlan = {
  planName: "Advanced Plan",
  workouts: [ValidMuscleGroupWorkoutPlan],
};

export const InvalidDetailedWorkoutPlan = {
  planName: "A",
  workouts: [],
};

export const validFullWorkoutPlan = {
  workoutPlans: [ValidWorkoutPlan],
};
