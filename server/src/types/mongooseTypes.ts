import { FilterQuery, ProjectionType, QueryOptions, UpdateQuery } from "mongoose";

export type FindOptions<T> = {
  query: FilterQuery<T>;
  projection?: ProjectionType<T>;
  queryOptions?: QueryOptions;
};

export type FindOptionsNoQuery<T> = Omit<FindOptions<T>, "query">;

export type UpdateOptions<T> = {
  filter: FilterQuery<T>;
  update: UpdateQuery<T>;
  options?: QueryOptions<T>;
};

export type DeleteOptions<T> = { 
  options: QueryOptions<T>;
};
