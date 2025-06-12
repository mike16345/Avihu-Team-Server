import { MuscleGroupService } from "../services/muscleGroupService";
import BaseController from "./BaseController";
import { IMuscleGroup } from "../interfaces/IWorkoutPlan";

export default class MuscleGroupController extends BaseController<IMuscleGroup> {
  constructor(){
    super(new MuscleGroupService())
  }
}


  

 
