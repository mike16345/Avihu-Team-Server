import { FilterQuery, ProjectionType, QueryOptions, PopulateOptions } from "mongoose";

export type FindOptions<T> = {
  query: FilterQuery<T>;
  projection?: ProjectionType<T>;
  queryOptions?: QueryOptions;
};

export type FindOptionsNoQuery<T> = Omit<FindOptions<T>, "query">;
