import { IFormResponse } from "../interfaces/IFormResponse";
import { MonthlyFormStatusResponse } from "../interfaces/IMonthlyFormStatus";
import { FormPresetRepository } from "../repositories/Presets/FormPresetRepository";
import { FormResponseRepository } from "../repositories/FormResponses/FormResponseRepository";
import { getOccurrenceKeyForForm } from "../utils/formOccurrences";
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

    const form = (await this.formPresetRepository.findById(String(payload.formId))) as any;

    return {
      ...payload,
      formTitle: hasTitle ? payload.formTitle : form?.name,
      formType: hasType ? payload.formType : form?.type,
    };
  }

  async create(doc: IFormResponse) {
    const hydrated = await this.hydrateFormMetadata(doc);
    const submittedAt = hydrated.submittedAt || new Date();

    return super.create({ ...hydrated, submittedAt } as IFormResponse);
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

  async getMonthlyFormStatus(
    userId?: string,
    now: Date = new Date()
  ): Promise<MonthlyFormStatusResponse> {
    if (!userId) {
      return {
        shouldShowMonthlyForm: false,
        reason: "MISSING_USER",
      };
    }

    const startOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfNextMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const hasSubmittedThisMonth = await this.repository.hasSubmittedFormTypeBetween({
      userId,
      formType: "monthly",
      submittedAt: {
        $gte: startOfMonthUtc,
        $lt: startOfNextMonthUtc,
      },
    });

    if (hasSubmittedThisMonth) {
      return {
        shouldShowMonthlyForm: false,
        reason: "MONTHLY_FORM_ALREADY_SUBMITTED",
      };
    }

    const latestMonthlyPreset = await this.formPresetRepository.findLatestByType("monthly");

    if (!latestMonthlyPreset) {
      return {
        shouldShowMonthlyForm: false,
        reason: "NO_MONTHLY_FORM_PRESET",
      };
    }

    const occurrenceKey = getOccurrenceKeyForForm(latestMonthlyPreset, now);

    if (!occurrenceKey) {
      return {
        shouldShowMonthlyForm: false,
        reason: "NO_MONTHLY_FORM_PRESET",
      };
    }

    return {
      shouldShowMonthlyForm: true,
      presetId: String((latestMonthlyPreset as any)._id),
      occurrenceKey,
      reason: "MONTHLY_FORM_NOT_SUBMITTED",
    };
  }
}
