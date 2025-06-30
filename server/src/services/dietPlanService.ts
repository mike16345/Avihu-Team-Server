import { FilterQuery } from "mongoose";
import { IDietPlan } from "../interfaces/IDietPlan";
import { DietPlanRepository } from "../repositories/DietPlan/DietPlanRepository";
import { stableStringify } from "../utils/utils";
import { BaseService } from "./BaseService";




const baseKey='diet-plan'; 

export class DietPlanService extends BaseService<IDietPlan,DietPlanRepository> {
  constructor(){
    super(new DietPlanRepository(),baseKey)
  }


 protected getDietPlan=async(query:FilterQuery<IDietPlan>,populate:boolean)=>{

    if(populate){
      const key= this.generateCacheKey('one',stableStringify({...query,populate}))
  
       const cached=this.cache.get(key);
  
       if(cached) return cached;
  
       const dietPlan=await this.repository.getPopulatedDietPlan(query);
  
       this.cache.set(key,dietPlan)
  
       return dietPlan
      }else{
  
        
        return await this.findOne(query)
      }
  }
  



   getDietPlanById=async( planId: string, populate: boolean = true)=> {
    const query={_id:planId};
    
    try {

   return await this.getDietPlan(query,populate);
  
    } catch (error) {
      throw error;
    }
  }

  async getDietPlanByUserId(userId: string, populate: boolean = true) {
    try {
      return await this.getDietPlan({ userId }, populate);
    } catch (error) {
      throw error;
    }
  }

 

 

 

  
}


