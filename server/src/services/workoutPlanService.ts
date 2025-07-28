import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import { WorkoutPlanRepository } from "../repositories/workoutPlan/WorkoutPlanRepository";
import { sanitizeWorkoutPlanForInsert } from "../utils/workoutPlanUtils";
import { BaseService } from "./baseService";

const RESOURCE_NAME = `workout-plan`;

export class WorkoutPlanService extends BaseService<IFullWorkoutPlan, WorkoutPlanRepository> {
  constructor() {
    super(new WorkoutPlanRepository(), RESOURCE_NAME);
  }

  addWorkoutPlan = async (workoutPlan: IFullWorkoutPlan) => {
    const plan = await sanitizeWorkoutPlanForInsert(workoutPlan);
    const newPlan = await this.repository.create(plan);

    return newPlan;
  };
}
