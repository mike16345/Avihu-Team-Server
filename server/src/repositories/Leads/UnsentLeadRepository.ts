import { IUnsentLead } from "../../interfaces/IUnsentLead";
import { UnsentLeadModel } from "../../models/unsentLeadModel";
import { BaseRepository } from "../BaseRepository";

export default class UnsentLeadRepository extends BaseRepository<IUnsentLead> {
  constructor() {
    super(UnsentLeadModel);
  }

  async getAllLeads() {
    return this.model.find().lean().exec();
  }
}
