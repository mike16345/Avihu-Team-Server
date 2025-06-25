import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import { WorkoutPlanRepository } from "../repositories/workoutPlan/WorkoutPlanRepository";
import { BaseService } from "./baseService";


const RESOURCE_NAME = `workout-plan`;

export class WorkoutPlanService extends BaseService<IFullWorkoutPlan> {
  constructor(){
    super(new WorkoutPlanRepository(),RESOURCE_NAME)
  }

}

export const workoutPlanService = new WorkoutPlanService();
