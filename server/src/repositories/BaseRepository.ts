import { FilterQuery, Model, UpdateWriteOpResult } from "mongoose";
import { PaginationParams, PaginationResult } from "../utils/pagination";
import { FindOptions, FindOptionsNoQuery } from "../types/mongooseTypes";
import {
  CREATE_FAILURE,
  DELETE_FAILURE,
  FIND_FAILURE,
  FIND_ONE_FAILURE,
  NOT_FOUND_FAILURE,
  UPDATE_FAILURE,
} from "../constants/repository";

export class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(doc: any): Promise<T> {
    const newDoc = await this.model.create(doc);

    if (!newDoc) throw new Error(CREATE_FAILURE);

    return newDoc;
  }

  async find(options: FindOptions<T> = { query: {} }) {
    const { query, projection, queryOptions } = options;
    let data = await this.model.find(query, projection, queryOptions);

    if (!data) throw new Error(FIND_FAILURE);

    return data;
  }

  async findById(id: string, options?: FindOptionsNoQuery<T>) {
    const { projection = {}, queryOptions = {} } = options || {};
    const item = await this.model.findById(id, projection, queryOptions);

    if (!item) throw new Error(FIND_ONE_FAILURE);

    return item;
  }

  async findOne(options: FindOptions<T>) {
    const { projection, queryOptions, query } = options;

    const item = await this.model.findOne(query, projection, queryOptions);

    if (!item) throw new Error(FIND_ONE_FAILURE);

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

    if (!updatedDoc) throw new Error(NOT_FOUND_FAILURE);

    return updatedDoc;
  }

  async updateById(id: string, data: any) {
    const updatedDoc = await this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();

    if (!updatedDoc) throw new Error(NOT_FOUND_FAILURE);

    return updatedDoc;
  }

  async updateMany(query: FilterQuery<T>, data: any): Promise<UpdateWriteOpResult> {
    const updateResult = await this.model.updateMany(query, data);

    if (!updateResult) throw new Error(UPDATE_FAILURE);

    return updateResult;
  }

  async deleteById(id: string) {
    const deletedDoc = await this.model.findByIdAndDelete(id).lean().exec();

    if (!deletedDoc) throw new Error(NOT_FOUND_FAILURE);

    return deletedDoc;
  }

  async delete(query: FilterQuery<T>) {
    const deletedDoc = await this.model.findOneAndDelete(query).lean().exec();

    if (!deletedDoc) throw new Error(NOT_FOUND_FAILURE);

    return deletedDoc;
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const deleteResult = await this.model.deleteMany(query);

    if (!deleteResult) throw new Error(DELETE_FAILURE);

    return deleteResult;
  }
}
