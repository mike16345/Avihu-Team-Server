import { FilterQuery } from "mongoose";
import { IAgreementTemplate } from "../../interfaces/IAgreement";
import { AgreementTemplateModel } from "../../models/agreementTemplateModel";
import { BaseRepository } from "../BaseRepository";

export class AgreementTemplateRepository extends BaseRepository<IAgreementTemplate> {
  constructor() {
    super(AgreementTemplateModel, { type: "trainer", field: "trainerId" });
  }

  findActiveTemplate = async (query: FilterQuery<IAgreementTemplate>) => {
    return this.model.findOne({ ...query, active: true }).lean();
  };

  findByAgreementVersion = async (query: FilterQuery<IAgreementTemplate>) => {
    return this.model.findOne(query).lean();
  };

  getLatestVersion = async (query: FilterQuery<IAgreementTemplate>) => {
    return this.model.findOne(query).sort({ version: -1 }).lean();
  };

  deactivateTemplates = async (query: FilterQuery<IAgreementTemplate>) => {
    return this.model.updateMany(query, { $set: { active: false } });
  };
}
