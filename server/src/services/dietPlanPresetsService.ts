import { IDietPlanPreset } from "../interfaces/IDietPlan";
import { DietPlanPresetRepository } from "../repositories/Presets/DietPlanPresetRepository";
import { BaseService } from "./BaseService";


const baseKey='diet-plan-preset';

export class DietPlanPresetsService extends BaseService<IDietPlanPreset,DietPlanPresetRepository> {
  constructor(){
    super(new DietPlanPresetRepository(),baseKey)
  }





   

  
 

}
