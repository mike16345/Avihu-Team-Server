interface CacheOptions<T> {
  expireAfter?: number; // in milliseconds
  initialData?: T;
}

export class Cache<T> {
  private cache: { [key: string]: { data: T; expiresAt: number | null } } = {};

  // Set data in the cache with an optional expiration time
  set(key: string, data?: T | null, options?: CacheOptions<T>): void {
    // const expiresAt = options?.expireAfter ? Date.now() + options.expireAfter : null;
    // this.cache[key] = {
    //   data,
    //   expiresAt,
    // };
  }

  // Get data from the cache, returns null if not found or expired
  get(key: string): T | null {
    return null;
    // const cacheEntry = this.cache[key];

    // if (!cacheEntry) {
    //   console.log("Cache miss for KEY:", key);
    //   return null;
    // }

    // // Check if the cache entry has expired
    // if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
    //   console.log("Cache expired returning null");
    //   delete this.cache[key];
    //   return null;
    // }
    // console.log("Returning cached data for KEY:", key);

    // return cacheEntry.data;
  }

  // Invalidate a specific cache entry
  invalidate(key: string): void {
    delete this.cache[key];
  }

  invalidateAllContaining(wordToFind: string) {
    for (const key in this.cache) {
      if (key.includes(wordToFind)) {
        delete this.cache[key];
      }
    }
  }

  // Invalidate all cache entries
  invalidateAll(): void {
    console.log("Invalidating all cache entries");
    this.cache = {};
  }
}

const cacheMap: Record<string, Cache<any>> = {};

export function getSharedCache<T = any>(key: string): Cache<T> {
  const namespacedKey = `global:${key}`;

  if (!cacheMap[namespacedKey]) {
    cacheMap[namespacedKey] = new Cache<T>();
  }

  return cacheMap[namespacedKey];
}
