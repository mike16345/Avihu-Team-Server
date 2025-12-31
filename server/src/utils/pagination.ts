import { stableStringify } from "./utils";

export interface PaginationParams {
  limit: number;
  page: number;
  query?: Record<string, any> | string;
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

export const generatePaginationCacheKey = (
  resource: string,
  { limit, page, query = {}, sort }: PaginationParams
): string => {
  const sortedQuery = stableStringify(query);

  return `${resource}?page=${page}&limit=${limit}&sort=${sort}&query=${sortedQuery}`;
};
