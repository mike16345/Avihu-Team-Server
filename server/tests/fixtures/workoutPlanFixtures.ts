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
  muscleGroups: [ValidMuscleGroupWorkoutPlan],
};

export const InvalidWorkoutPlan = {
  planName: "",
  muscleGroups: [ValidMuscleGroupWorkoutPlan],
};

export const ValidDetailedWorkoutPlan = {
  planName: "Advanced Plan",
  muscleGroups: [ValidMuscleGroupWorkoutPlan],
};

export const InvalidDetailedWorkoutPlan = {
  planName: "A",
  muscleGroups: [],
};

export const validFullWorkoutPlan = {
  workoutPlans: [ValidWorkoutPlan],
};
