interface CacheOptions<T> {
  expireAfter?: number; // in milliseconds
  initialData?: T;
}

export class Cache<T> {
  private cache: { [key: string]: { data: T; expiresAt: number | null } } = {};

  // Set data in the cache with an optional expiration time
  set(key: string, data?: T | null, options?: CacheOptions<T>): void {
    if (!data) return;
    const expiresAt = options?.expireAfter ? Date.now() + options.expireAfter : null;

    this.cache[key] = {
      data,
      expiresAt,
    };
  }

  // Get data from the cache, returns null if not found or expired
  get(key: string): T | null {
    const cacheEntry = this.cache[key];

    if (!cacheEntry) return null;

    // Check if the cache entry has expired
    if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
      delete this.cache[key];
      return null;
    }

    return cacheEntry.data;
  }

  // Invalidate a specific cache entry
  invalidate(key: string): void {
    delete this.cache[key];
  }

  // Invalidate all cache entries
  invalidateAll(): void {
    this.cache = {};
  }
}
