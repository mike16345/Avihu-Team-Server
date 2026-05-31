import { isValidObjectId } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { ILead } from "../interfaces/ILead";
import { LeadsModel } from "../models/LeadsModel";

export default class LeadsRepository extends BaseRepository<ILead> {
  constructor() {
    super(LeadsModel, { type: "global" });
  }

  async create(doc: Partial<ILead>): Promise<ILead> {
    const created = await this.model.create(doc as ILead);

    return created.toObject() as ILead;
  }

  async findPaginated({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }): Promise<{ items: ILead[]; total: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.find().sort({ isContacted: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments(this.applyScopeToQuery()),
    ]);

    return { items: (items as unknown as ILead[]) ?? [], total };
  }

  async findById(id: string): Promise<ILead | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    return this.model.findById(id).lean();
  }

  async updateById(id: string, update: Partial<ILead>): Promise<ILead | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }

    const result = await this.model.findByIdAndDelete(id).lean();

    return !!result;
  }
}
