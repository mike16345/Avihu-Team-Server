import { FilterQuery } from "mongoose";
import { IAgreementTemplate } from "../interfaces/IAgreement";
import { AgreementTemplateRepository } from "../repositories/Agreements/AgreementTemplateRepository";
import { BaseService } from "./BaseService";

const baseKey = "agreement-templates";

export class AgreementTemplateService extends BaseService<
  IAgreementTemplate,
  AgreementTemplateRepository
> {
  constructor() {
    super(new AgreementTemplateRepository(), baseKey);
  }

  async getActiveTemplate(query: FilterQuery<IAgreementTemplate>) {
    return this.repository.findActiveTemplate(query);
  }

  async getTemplateByVersion(query: FilterQuery<IAgreementTemplate>) {
    return this.repository.findByAgreementVersion(query);
  }

  async getLatestTemplate(query: FilterQuery<IAgreementTemplate>) {
    return this.repository.getLatestVersion(query);
  }

  async deactivateTemplates(query: FilterQuery<IAgreementTemplate>) {
    return this.repository.deactivateTemplates(query);
  }
}
