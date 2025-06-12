import { ICardioWorkout } from "../interfaces/IWorkoutPlan";
import { BaseService } from "./baseService";
import { CardioWorkoutRepository } from "../repositories/CardioWorkout/CardioWorkoutRepository";


const RESOURCE_NAME='cardio-workout'

export class CardioWorkoutService extends BaseService<ICardioWorkout> {
  constructor(){
    super(new CardioWorkoutRepository,RESOURCE_NAME)
  }

}
