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
import { requireTrainerAuthContext } from "../utils/authContext";

export type ModelScope =
  | {
      type: "trainer";
      field: "trainerId";
    }
  | {
      type: "global";
    };

export class BaseRepository<T> {
  protected model: Model<any>;
  protected scope: ModelScope;

  constructor(model: Model<any>, scope: ModelScope) {
    this.model = model;
    this.scope = scope;
    this.validateScopeConfiguration();
  }

  protected supportsSoftDelete(): boolean {
    return Boolean((this.model as any)?.schema?.path("isDeleted"));
  }

  protected withSoftDeleteFilter<Q extends Record<string, any>>(query?: Q): Q {
    const baseQuery = (query ?? {}) as Q;

    if (!this.supportsSoftDelete()) {
      return baseQuery;
    }

    if (Object.prototype.hasOwnProperty.call(baseQuery, "isDeleted")) {
      return baseQuery;
    }

    return { ...baseQuery, isDeleted: false };
  }

  protected isTrainerScoped(): boolean {
    return this.scope.type === "trainer";
  }

  protected getScopeMatch(): Record<string, any> {
    if (this.scope.type !== "trainer") {
      return {};
    }

    const { trainerId } = requireTrainerAuthContext();

    return {
      [this.scope.field]: trainerId,
    };
  }

  protected applyScopeToQuery<Q extends Record<string, any>>(query?: Q): Q {
    const baseQuery = { ...((query ?? {}) as Record<string, any>) };
    const updatedQuery = {
      ...baseQuery,
      ...this.getScopeMatch(),
    } as Q;

    console.log("Applying scope to query Updated query:", updatedQuery);

    return updatedQuery;
  }

  protected withScopedSoftDeleteFilter<Q extends Record<string, any>>(query?: Q): Q {
    const scopedQuery = this.applyScopeToQuery(query);
    console.log("Applying soft delete filter to query. Before:", scopedQuery);
    const finalQuery = this.withSoftDeleteFilter(scopedQuery);
    console.log("Final query after applying soft delete filter:", finalQuery);

    return finalQuery;
  }

  protected applyScopeToCreate<D>(doc: D): D {
    if (!this.isTrainerScoped() || !doc || typeof doc !== "object") {
      return doc;
    }

    return {
      ...(doc as Record<string, any>),
      ...this.getScopeMatch(),
    } as D;
  }

  protected applyScopeToUpdate<U>(update: U): U {
    if (!this.isTrainerScoped() || !update || typeof update !== "object") {
      return update;
    }

    const scopedUpdate = { ...(update as Record<string, any>) };
    const scopeField = this.scope.type === "trainer" ? this.scope.field : "trainerId";
    const scopeMatch = this.getScopeMatch();
    const hasOperators = Object.keys(scopedUpdate).some((key) => key.startsWith("$"));

    delete scopedUpdate[scopeField];

    for (const operator of ["$set", "$setOnInsert", "$unset"]) {
      if (this.isPlainObject(scopedUpdate[operator])) {
        scopedUpdate[operator] = { ...scopedUpdate[operator] };
        delete scopedUpdate[operator][scopeField];
      }
    }

    if (hasOperators) {
      scopedUpdate.$setOnInsert = {
        ...(this.isPlainObject(scopedUpdate.$setOnInsert) ? scopedUpdate.$setOnInsert : {}),
        ...scopeMatch,
      };
    } else {
      Object.assign(scopedUpdate, scopeMatch);
    }

    return scopedUpdate as U;
  }

  async create(doc: T): Promise<T> {
    const scopedDoc = this.applyScopeToCreate(doc);
    console.log("Creating document with scope applied:", scopedDoc);
    const newDoc = await this.model.create(scopedDoc);

    console.log("Created document:", newDoc);
    return newDoc;
  }

  async isExists(filter: RootFilterQuery<T>): Promise<boolean> {
    const count = await this.model.exists(
      this.withScopedSoftDeleteFilter(filter as Record<string, any>)
    );

    return count !== null;
  }

  async find(options: FindOptions<T> = { query: {} }) {
    const { query, projection, queryOptions } = options;
    const filteredQuery = this.withScopedSoftDeleteFilter(query as Record<string, any>);
    const data = await this.model.find(filteredQuery, projection, queryOptions);

    if (data.length === 0) {
      return [];
    }

    if (!data) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_FAILURE };
    }

    return data;
  }

  async findById(id: string, options?: FindOptionsNoQuery<T>) {
    const { projection = {}, queryOptions = {} } = options || {};
    const item = await this.model
      .findOne(this.withSoftDeleteFilter({ _id: id }), projection, queryOptions)
      .lean()
      .exec();

    if (!item) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return item;
  }

  async findOne(options: FindOptions<T>) {
    const { projection, queryOptions, query } = options;
    const filteredQuery = this.withSoftDeleteFilter(query as Record<string, any>);

    const item = await this.model.findOne(filteredQuery, projection, queryOptions).lean().exec();

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
    const parsedQuery = query ?? {};
    const filteredQuery = this.withScopedSoftDeleteFilter(parsedQuery);

    const [results, totalResults] = await Promise.all([
      this.model.find(filteredQuery).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filteredQuery).exec(),
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
    const updatedDoc = await this.model.findOneAndUpdate(
      this.withScopedSoftDeleteFilter(filter as Record<string, any>),
      this.applyScopeToUpdate(update),
      options
    );

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
    const updateResult = await this.model.updateMany(
      this.withScopedSoftDeleteFilter(query as Record<string, any>),
      this.applyScopeToUpdate(data)
    );

    if (updateResult.modifiedCount === 0) {
      throw { status: StatusCode.NOT_FOUND, message: UPDATE_FAILURE };
    }

    return updateResult;
  }

  async deleteById(id: string, options?: QueryOptions<T>) {
    if (this.supportsSoftDelete()) {
      const deletedDoc = await this.model
        .findOneAndUpdate(
          this.withScopedSoftDeleteFilter({ _id: id }),
          { isDeleted: true },
          { new: true }
        )
        .lean()
        .exec();

      return deletedDoc;
    }

    const deletedDoc = await this.model
      .findOneAndDelete(this.applyScopeToQuery({ _id: id }), options)
      .lean()
      .exec();

    return deletedDoc;
  }

  async hardDeleteById(id: string, options?: QueryOptions<T>) {
    return await this.model.findByIdAndDelete(id, options).lean().exec();
  }

  async delete(query: FilterQuery<T>) {
    if (!query || Object.keys(query).length === 0) {
      throw new Error("Empty query would result in unintended delete.");
    }

    if (this.supportsSoftDelete()) {
      const deletedDoc = await this.model
        .findOneAndUpdate(
          this.withScopedSoftDeleteFilter(query as Record<string, any>),
          { isDeleted: true },
          { new: true }
        )
        .lean()
        .exec();

      return deletedDoc;
    }

    const deletedDoc = await this.model.findOneAndDelete(query).lean().exec();

    return deletedDoc;
  }

  async hardDelete(query: FilterQuery<T>) {
    if (!query || Object.keys(query).length === 0) {
      throw new Error("Empty query would result in unintended delete.");
    }

    return await this.model.findOneAndDelete(query).lean().exec();
  }

  async deleteMany(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    if (this.supportsSoftDelete()) {
      const updateResult = await this.model.updateMany(
        this.withScopedSoftDeleteFilter(query as Record<string, any>),
        { isDeleted: true }
      );

      return { deletedCount: updateResult.modifiedCount };
    }

    const deleteResult = await this.model.deleteMany(query);

    return deleteResult;
  }

  private validateScopeConfiguration() {
    const schema = (this.model as any)?.schema;

    if (!schema || typeof schema.path !== "function") {
      return;
    }

    if (this.scope.type === "trainer" && !schema.path(this.scope.field)) {
      this.handleTrainerScopeMismatch(
        `[${this.model.modelName}] trainer scope requires missing schema field "${this.scope.field}".`
      );
      return;
    }

    if (this.scope.type === "global" && schema.path("trainerId")) {
      this.handleGlobalScopeMismatch(
        `[${this.model.modelName}] is marked global but schema contains "trainerId".`
      );
    }
  }

  private handleTrainerScopeMismatch(message: string) {
    if (process.env.NODE_ENV === "production") {
      console.warn(message);
      return;
    }

    throw new Error(message);
  }

  private handleGlobalScopeMismatch(message: string) {
    console.warn(message);
  }

  private isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
