import { FilterQuery, Model, ObjectId, QueryOptions, UpdateWriteOpResult } from "mongoose";
import { PaginationParams, PaginationResult } from "../utils/pagination";
import { FindOptions, FindOptionsNoQuery, UpdateOptions } from "../types/mongooseTypes";
import { CREATE_FAILURE, FIND_ONE_FAILURE } from "../constants/repository";

export class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(doc: T): Promise<T> {
    const newDoc = await this.model.create(doc);

    return newDoc;
  }

  async find(options: FindOptions<T> = { query: {} }) {
    const { query, projection, queryOptions } = options;
    const data = await this.model.find(query, projection, queryOptions);

    return data;
  }

  async findById(id: string, options?: FindOptionsNoQuery<T>) {
    const { projection = {}, queryOptions = {} } = options || {};
    const item = await this.model.findById(id, projection, queryOptions);

    return item;
  }

  async findOne(options: FindOptions<T>) {
    const { projection, queryOptions, query } = options;

    const item = await this.model.findOne(query, projection, queryOptions);

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

  async updateOne(updateOptions: UpdateOptions<T>) {
    const { options, filter, update } = updateOptions;
    const updatedDoc = await this.model.findOneAndUpdate(filter, update, options);

    return updatedDoc;
  }

  async updateById(id: string | ObjectId, updateOptions: Omit<UpdateOptions<T>, "filter">) {
    const { options, update } = updateOptions;
    const updatedDoc = await this.model.findByIdAndUpdate(id, update, options);

    return updatedDoc;
  }

  async updateMany(query: FilterQuery<T>, data: any): Promise<UpdateWriteOpResult> {
    const updateResult = await this.model.updateMany(query, data);

    return updateResult;
  }

  async deleteById(id: string, options?: QueryOptions<T>) {
    const deletedDoc = await this.model.findByIdAndDelete(id, options).lean().exec();

    return deletedDoc;
  }

  async delete(query: FilterQuery<T>) {
    const deletedDoc = await this.model.findOneAndDelete(query).lean().exec();

    return deletedDoc;
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const deleteResult = await this.model.deleteMany(query);

    return deleteResult;
  }
}
