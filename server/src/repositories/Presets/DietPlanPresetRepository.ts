import { IDietPlanPreset } from "../../interfaces/IDietPlan";
import { DietPlanPresetsModel } from "../../models/dietPlanPresetModel";
import { BaseRepository } from "../BaseRepository";

export class DietPlanPresetRepository extends BaseRepository<IDietPlanPreset> {
  constructor() {
    super(DietPlanPresetsModel, { type: "trainer", field: "trainerId" });
  }
}
