import { ValidDetailedWorkoutPlan } from "./workoutPlanFixtures";

export const validWorkoutPlanPreset = {
  name: "Valid Preset",
  tips: ["Control the eccentric"],
  workoutPlans: [ValidDetailedWorkoutPlan],
  cardio: {
    type: "simple",
    plan: {
      minsPerWeek: 60,
      timesPerWeek: 2,
      minsPerWorkout: 30,
    },
  },
};

export const invalidWorkoutPlanPresetEmptyPlans = {
  name: "Invalid Preset",
  tips: [],
  workoutPlans: [],
  cardio: {
    type: "simple",
    plan: {
      minsPerWeek: 60,
      timesPerWeek: 2,
    },
  },
};

export const invalidWorkoutPlanPresetNoName = {
  tips: [],
  workoutPlans: [ValidDetailedWorkoutPlan],
  cardio: {
    type: "simple",
    plan: {
      minsPerWeek: 60,
      timesPerWeek: 2,
    },
  },
};
