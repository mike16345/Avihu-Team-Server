import { ISubTrainer } from "../../interfaces/ISubTrainer";
import { SubTrainerModel } from "../../models/subTrainerModel";
import { BaseRepository } from "../BaseRepository";

export default class SubTrainerRepository extends BaseRepository<ISubTrainer> {
  constructor() {
    super(SubTrainerModel);
  }
}
