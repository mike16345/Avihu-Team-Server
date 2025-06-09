import { Model } from "mongoose";
import { sortObjectKeys } from "./utils";

export interface PaginationParams {
  model: Model<any>;
  limit: number;
  page: number;
  query?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
}

export interface PaginationResult<T> {
  results: T[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}


export const generatePaginationCacheKey=(resource:string,{
  limit,
  page,
  query={},
  sort
}:PaginationParams):string=>{
  const sortedQuery = JSON.stringify(sortObjectKeys(query));

  return `${resource}?page=${page}&limit=${limit}&sort=${sort}&query=${sortedQuery}`;
}

async function paginate<T>({
  model,
  limit,
  page,
  query = {},
  sort = {},
}: PaginationParams): Promise<PaginationResult<T>> {
  const skip = (page - 1) * limit;
  const [results, totalResults] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit).exec(),
    model.countDocuments(query).exec(),
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

export default paginate;
