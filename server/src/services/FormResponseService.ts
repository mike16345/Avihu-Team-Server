import { IFormResponse } from "../interfaces/IFormResponse";
import { FormPresetRepository } from "../repositories/Presets/FormPresetRepository";
import { FormResponseRepository } from "../repositories/FormResponses/FormResponseRepository";
import { BaseService } from "./baseService";

const RESOURCE_NAME = "form-responses";

export class FormResponseService extends BaseService<IFormResponse, FormResponseRepository> {
  private formPresetRepository: FormPresetRepository;

  constructor() {
    super(new FormResponseRepository(), RESOURCE_NAME);
    this.formPresetRepository = new FormPresetRepository();
  }

  private async hydrateFormMetadata(payload: Partial<IFormResponse>) {
    const hasTitle = payload.formTitle !== undefined && payload.formTitle !== null;
    const hasType = payload.formType !== undefined && payload.formType !== null;

    if ((hasTitle && hasType) || !payload.formId) {
      return payload;
    }

    const form = await this.formPresetRepository.findById(String(payload.formId));

    return {
      ...payload,
      formTitle: hasTitle ? payload.formTitle : form?.name,
      formType: hasType ? payload.formType : form?.type,
    };
  }

  async create(doc: IFormResponse) {
    const hydrated = await this.hydrateFormMetadata(doc);
    const submittedAt = hydrated.submittedAt || new Date();

    return super.create({ ...hydrated, submittedAt });
  }

  async updateById(id: string, update: Partial<IFormResponse>) {
    const hydrated = await this.hydrateFormMetadata(update);

    return super.updateById(id, hydrated);
  }

  getUserResponse(userId: string): Promise<IFormResponse | null> {
    return this.repository.getUserResponse({ query: { userId } });
  }

  find(filter?: Partial<Record<keyof IFormResponse, any>>): Promise<IFormResponse[]> {
    return this.repository.find({
      query: filter || {},
      queryOptions: { sort: { isChecked: 1, submittedAt: -1 } },
    });
  }
}
