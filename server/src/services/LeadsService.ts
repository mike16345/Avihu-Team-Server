import { BaseService } from "./baseService";
import LeadsRepository from "../repositories/LeadsRepository";
import { ILead } from "../interfaces/ILead";

interface ListParams {
  page?: number | string;
  limit?: number | string;
}

export default class LeadsService extends BaseService<ILead, LeadsRepository> {
  constructor() {
    super(new LeadsRepository(), "leads");
  }

  async createLead(payload: Partial<ILead>): Promise<ILead> {
    const leadPayload: Partial<ILead> = {
      ...payload,
      registeredAt: payload.registeredAt ? new Date(payload.registeredAt) : new Date(),
    };

    const lead = await this.repository.create(leadPayload);

    this.cache.invalidateAll();

    return lead;
  }

  async listLeads(params: ListParams): Promise<{
    items: ILead[];
    page: number;
    limit: number;
    total: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 25);
    const cacheKey = this.generateCacheKey("list", `${page}:${limit}`);

    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const { items, total } = await this.repository.findPaginated({ page, limit });
    const result = { items, page, limit, total };

    this.cache.set(cacheKey, result);

    return result;
  }

  async getLeadById(id: string): Promise<ILead | null> {
    const cacheKey = this.generateCacheKey("id", id);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const lead = await this.repository.findById(id);

    if (lead) {
      this.cache.set(cacheKey, lead);
    }

    return lead;
  }

  async updateLead(id: string, update: Partial<ILead>): Promise<ILead | null> {
    const updated = await this.repository.updateById(id, update);

    if (updated) {
      this.cache.invalidateAll();
    }

    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    const deleted = await this.repository.deleteById(id);

    if (deleted) {
      this.cache.invalidateAll();
    }

    return deleted;
  }
}
