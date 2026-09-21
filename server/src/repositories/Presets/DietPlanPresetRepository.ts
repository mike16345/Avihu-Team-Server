import { Types } from "mongoose";
import { IDietPlanPreset } from "../../interfaces/IDietPlan";
import { IDietPlanPresetV2Document } from "../../interfaces/IDietPlanV2";
import { DietPlanPresetsModel } from "../../models/dietPlanPresetModel";
import { DietPlanPresetV2Model } from "../../models/dietPlanV2Schemas";
import { BaseRepository } from "../BaseRepository";

export type AnyDietPlanPresetDocument =
  | (IDietPlanPreset & { trainerId: Types.ObjectId })
  | IDietPlanPresetV2Document;

export class DietPlanPresetRepository extends BaseRepository<IDietPlanPreset> {
  constructor() {
    super(DietPlanPresetsModel, { type: "trainer", field: "trainerId" });
  }

  async findByVersion(version: 1 | 2): Promise<AnyDietPlanPresetDocument[]> {
    const scope = this.getScopeMatch();
    const versionQuery =
      version === 2
        ? { version: 2 }
        : { $or: [{ version: 1 }, { version: { $exists: false } }] };

    return (await DietPlanPresetsModel.collection
      .find({ ...scope, ...versionQuery })
      .toArray()) as unknown as AnyDietPlanPresetDocument[];
  }

  async findScopedById(id: string): Promise<AnyDietPlanPresetDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return (await DietPlanPresetsModel.collection.findOne({
      ...this.getScopeMatch(),
      _id: new Types.ObjectId(id),
    })) as unknown as AnyDietPlanPresetDocument | null;
  }

  async createVersioned(
    preset: AnyDietPlanPresetDocument
  ): Promise<AnyDietPlanPresetDocument> {
    const created =
      preset.version === 2
        ? await DietPlanPresetV2Model.create(preset as IDietPlanPresetV2Document)
        : await DietPlanPresetsModel.create(preset as any);

    return created.toObject() as unknown as AnyDietPlanPresetDocument;
  }

  async replaceScopedById(
    id: string,
    replacement: AnyDietPlanPresetDocument
  ): Promise<AnyDietPlanPresetDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const filter = { ...this.getScopeMatch(), _id: new Types.ObjectId(id) };
    const options = { new: true } as const;
    const updated =
      replacement.version === 2
        ? await DietPlanPresetV2Model.findOneAndReplace(
            filter,
            replacement as IDietPlanPresetV2Document,
            options
          ).lean()
        : await DietPlanPresetsModel.findOneAndReplace(
            filter,
            replacement as any,
            options
          ).lean();

    return updated as unknown as AnyDietPlanPresetDocument | null;
  }

  async deleteScopedById(id: string): Promise<AnyDietPlanPresetDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return (await DietPlanPresetsModel.collection.findOneAndDelete({
      ...this.getScopeMatch(),
      _id: new Types.ObjectId(id),
    })) as unknown as AnyDietPlanPresetDocument | null;
  }
}
