import { IForm } from "../../interfaces/IForm";
import { BaseRepository } from "../BaseRepository";
import { FormModel } from "../../models/formPresetModel";

export class FormPresetRepository extends BaseRepository<IForm> {
  constructor() {
    super(FormModel, { type: "trainer", field: "trainerId" });
  }

  async findLatestByType(type: IForm["type"]): Promise<IForm | null> {
    const query = this.withScopedSoftDeleteFilter({ type });

    return (await this.model
      .findOne(query, undefined, { sort: { createdAt: -1 } })
      .lean()
      .exec()) as IForm | null;
  }
}
