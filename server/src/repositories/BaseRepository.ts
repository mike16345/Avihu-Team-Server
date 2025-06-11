import { FilterQuery, Model, UpdateWriteOpResult } from "mongoose";
import { PaginationParams, PaginationResult } from "../utils/pagination";
import { FindOptions } from "../types/mongooseTypes";

export class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(doc: any): Promise<T> {
    const newDoc = await this.model.create(doc);

    if (!newDoc) throw new Error("Could not create item!");

    return newDoc;
  }

  async find(options: FindOptions<T> = { query: {} }) {
    const { query, projection, queryOptions } = options;
    let data = await this.model.find(query, projection, queryOptions);

    if (!data) throw new Error("Data could not be retrieved!");

    return data;
  }

  async findById(id: string, options?: FindOptions<T>) {
    const { projection = {}, queryOptions = {} } = options || {};
    const item = await this.model.findById(id, projection, queryOptions);

    if (!item) throw new Error("Could not retrieve item!");

    return item;
  }

  async findOne(options: FindOptions<T>) {
    const { projection, queryOptions, query } = options;
    const item = await this.model.findOne(query, projection, queryOptions);

    if (!item) throw new Error("Could not retrieve item!");

    return item;
  }

  async getPaginated({
    limit,
    page,
    query = {},
    sort = {},
  }: PaginationParams): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit;

    const [results, totalResults] = await Promise.all([
      this.model.find(query).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      totalResults,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async updateOne(query: FilterQuery<T>, data: any) {
    const updatedDoc = await this.model.findOneAndUpdate(query, data, { new: true }).lean().exec();

    if (!updatedDoc) throw new Error("Item not found");

    return updatedDoc;
  }

  async updateById(id: string, data: any) {
    const updatedDoc = await this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();

    if (!updatedDoc) throw new Error("Item not found");

    return updatedDoc;
  }

  async updateMany(query: FilterQuery<T>, data: any): Promise<UpdateWriteOpResult> {
    const updateResult = await this.model.updateMany(query, data);

    if (!updateResult) throw new Error("Update failed");

    return updateResult;
  }

  async deleteById(id: string) {
    const deletedDoc = await this.model.findByIdAndDelete(id).lean().exec();

    if (!deletedDoc) throw new Error("Item not found");

    return deletedDoc;
  }

  async delete(query: FilterQuery<T>) {
    const deletedDoc = await this.model.findOneAndDelete(query).lean().exec();

    if (!deletedDoc) throw new Error("Item not found");

    return deletedDoc;
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const deleteResult = await this.model.deleteMany(query);

    if (!deleteResult) throw new Error("Delete failed");

    return deleteResult;
  }
}
