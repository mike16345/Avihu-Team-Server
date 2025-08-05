import {
  FilterQuery,
  Model,
  ObjectId,
  QueryOptions,
  RootFilterQuery,
  UpdateWriteOpResult,
} from "mongoose";
import { PaginationParams, PaginationResult } from "../utils/pagination";
import { FindOptions, FindOptionsNoQuery, UpdateOptions } from "../types/mongooseTypes";
import { FIND_FAILURE, FIND_ONE_FAILURE, UPDATE_FAILURE } from "../constants/repository";
import { StatusCode } from "../enums/StatusCode";

export class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(doc: T): Promise<T> {
    const newDoc = await this.model.create(doc);

    return newDoc;
  }

  async isExists(filter: RootFilterQuery<T>): Promise<boolean> {
    const count = await this.model.exists(filter);

    return count !== null;
  }
  
  async find(options: FindOptions<T> = { query: {} }) {
    const { query, projection, queryOptions } = options;
    const data = await this.model.find(query, projection, queryOptions);

    if (!data || data.length === 0) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_FAILURE };
    }

    return data;
  }

  async findById(id: string, options?: FindOptionsNoQuery<T>) {
    const { projection = {}, queryOptions = {} } = options || {};
    const item = await this.model.findById(id, projection, queryOptions);

    if (!item) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return item;
  }

  async findOne(options: FindOptions<T>) {
    const { projection, queryOptions, query } = options;

    const item = await this.model.findOne(query, projection, queryOptions);

    if (!item) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

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

    if (!updatedDoc) {
      throw { status: StatusCode.NOT_FOUND, message: UPDATE_FAILURE };
    }

    return updatedDoc;
  }

  async updateById(id: string | ObjectId, updateOptions: Omit<UpdateOptions<T>, "filter">) {
    const { options, update } = updateOptions;
    const updatedDoc = await this.model.findByIdAndUpdate(id, update, options);

    if (!updatedDoc) {
      throw { status: StatusCode.NOT_FOUND, message: UPDATE_FAILURE };
    }

    return updatedDoc;
  }

  async updateMany(query: FilterQuery<T>, data: any): Promise<UpdateWriteOpResult> {
    const updateResult = await this.model.updateMany(query, data);

    if (updateResult.modifiedCount === 0) {
      throw { status: StatusCode.NOT_FOUND, message: UPDATE_FAILURE };
    }

    return updateResult;
  }

  async deleteById(id: string, options?: QueryOptions<T>) {
    const deletedDoc = await this.model.findByIdAndDelete(id, options).lean().exec();

    return deletedDoc;
  }

  async delete(query: FilterQuery<T>) {
    if (!query || Object.keys(query).length === 0) {
      throw new Error("Empty query would result in unintended delete.");
    }
    const deletedDoc = await this.model.findOneAndDelete(query).lean().exec();

    return deletedDoc;
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const deleteResult = await this.model.deleteMany(query);

    return deleteResult;
  }
}
