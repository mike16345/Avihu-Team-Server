import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import { workoutPlanRepository } from "../repositories/workoutPlan/WorkoutPlanRepository";
import { removeNestedIds } from "../utils/utils";
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
    const plan = sanitizeWorkoutPlanForInsert(workoutPlan) as IFullWorkoutPlan;
    const cleanedPlan = removeNestedIds(plan);
    const newPlan = await this.repository.create(cleanedPlan);

    return newPlan;
  };

  updateWorkoutPlan = async (workoutPlan: IFullWorkoutPlan, userId: string) => {
    const plan = sanitizeWorkoutPlanForInsert(workoutPlan);
    const cleanedPlan = removeNestedIds(plan);
    const updatedPlan = await this.repository.updateOne({
      filter: { userId },
      update: cleanedPlan,
    });

    return updatedPlan;
  };
}
