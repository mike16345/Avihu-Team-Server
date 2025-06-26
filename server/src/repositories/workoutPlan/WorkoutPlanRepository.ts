import { IFullWorkoutPlan } from "../../interfaces/IWorkoutPlan";
import { WorkoutPlan } from "../../models/workoutPlanModel";
import { BaseRepository } from "../BaseRepository";

export class WorkoutPlanRepository extends BaseRepository<IFullWorkoutPlan> {
  constructor() {
    super(WorkoutPlan);
  }
}
