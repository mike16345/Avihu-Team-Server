import { ITrainer } from "../../interfaces/ITrainer";
import { TrainerModel } from "../../models/trainerModel";
import { BaseRepository } from "../BaseRepository";

export default class TrainerRepository extends BaseRepository<ITrainer> {
  constructor() {
    super(TrainerModel, { type: "global" });
  }
}
