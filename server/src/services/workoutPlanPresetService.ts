import { IWorkoutPlanPreset } from "../models/workoutPlanPresetModel";
import { WorkoutPlanPresetRepository } from "../repositories/Presets/WorkoutPlanPresetRepository";
import { removeNestedIds } from "../utils/utils";
import { sanitizeWorkoutPlanForInsert } from "../utils/workoutPlanUtils";
import { BaseService } from "./BaseService";

const baseKey = "workout-plan-preset";

export class WorkoutPlanPresetService extends BaseService<
  IWorkoutPlanPreset,
  typeof WorkoutPlanPresetRepository
> {
  constructor() {
    super(WorkoutPlanPresetRepository, baseKey);
  }

  addWorkoutPlanPreset = async (workoutPlan: IWorkoutPlanPreset) => {
    const plan = (await sanitizeWorkoutPlanForInsert(workoutPlan)) as IWorkoutPlanPreset;
    const cleanedPlan = removeNestedIds(plan);
    const newPlan = await this.repository.create(cleanedPlan);

    return newPlan;
  };

  updateWorkoutPlanPreset = async (workoutPlan: IWorkoutPlanPreset, id: string) => {
    const plan = sanitizeWorkoutPlanForInsert(workoutPlan) as IWorkoutPlanPreset;
    const cleanedPlan = removeNestedIds(plan);
    const updatedPlan = await this.repository.updateById(id, { update: cleanedPlan });

    return updatedPlan;
  };
}
