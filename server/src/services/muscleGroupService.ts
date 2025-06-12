import { IMuscleGroup } from "../interfaces/IWorkoutPlan";
import { MuscleGroupRepository } from "../repositories/muscleGroups/muscleGroupRepository";
import { BaseService } from "./baseService";

const RESOURCE_NAME = `muscle-groups`;

export class MuscleGroupService extends BaseService<IMuscleGroup> {
  constructor(){
    super(new MuscleGroupRepository(),RESOURCE_NAME);
  }

}
