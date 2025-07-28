import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import { workoutPlanRepository } from "../repositories/workoutPlan/WorkoutPlanRepository";
import { sanitizeWorkoutPlanForInsert } from "../utils/workoutPlanUtils";
import { BaseService } from "./baseService";

const RESOURCE_NAME = `workout-plan`;

export class WorkoutPlanService extends BaseService<
  IFullWorkoutPlan,
  typeof workoutPlanRepository
> {
  constructor() {
    super(workoutPlanRepository, RESOURCE_NAME);
  }

  addWorkoutPlan = async (workoutPlan: IFullWorkoutPlan) => {
    const plan = await sanitizeWorkoutPlanForInsert(workoutPlan);
    const newPlan = await this.repository.create(plan);

    return newPlan;
  };
}
