import { ICardioWorkout } from "../../interfaces/IWorkoutPlan";
import { cardioWorkoutPreset } from "../../models/cardioWorkoutmodel";
import { BaseRepository } from "../BaseRepository";

export class CardioWorkoutRepository extends BaseRepository<ICardioWorkout> {
  constructor() {
    super(cardioWorkoutPreset, { type: "trainer", field: "trainerId" });
  }
}
