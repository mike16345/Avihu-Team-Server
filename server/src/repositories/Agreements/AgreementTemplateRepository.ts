import { FilterQuery } from "mongoose";
import { IAgreementTemplate } from "../../interfaces/IAgreement";
import { AgreementTemplateModel } from "../../models/agreementTemplateModel";
import { BaseRepository } from "../BaseRepository";

export class AgreementTemplateRepository extends BaseRepository<IAgreementTemplate> {
  constructor() {
    super(AgreementTemplateModel, { type: "trainer", field: "trainerId" });
  }

  findActiveTemplate = async (query: FilterQuery<IAgreementTemplate>) => {
    const scopedQuery = this.applyScopeToQuery({ ...query, active: true });

    return this.model.findOne(scopedQuery).lean();
  };

  findByAgreementVersion = async (query: FilterQuery<IAgreementTemplate>) => {
    const scopedQuery = this.applyScopeToQuery({ ...query, active: true });

    return this.model.findOne(scopedQuery).lean();
  };

  getLatestVersion = async (query: FilterQuery<IAgreementTemplate>) => {
    const scopedQuery = this.applyScopeToQuery(query);

    return this.model.findOne(scopedQuery).sort({ version: -1 }).lean();
  };

  deactivateTemplates = async (query: FilterQuery<IAgreementTemplate>) => {
    const scopedQuery = this.applyScopeToQuery(query);

    return this.model.updateMany(scopedQuery, { $set: { active: false } });
  };
}
