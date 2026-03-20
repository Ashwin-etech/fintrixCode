// Advanced caching utilities for API optimization

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  // Get data from cache or return null if expired/not found
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Set data in cache with TTL in milliseconds
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Get cached data or execute function and cache result
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(key);
    if (pending) return pending;

    // Execute request and cache result
    const promise = fetcher()
      .then((data) => {
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Clear cache entries matching pattern
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      this.pendingRequests.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (key.includes(pattern)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const apiCache = new APICache();

// Enhanced fetchJSON with caching
export async function fetchJSONWithCache<T = any>(
  url: string,
  options: {
    revalidate?: number;
    cacheKey?: string;
    bypassCache?: boolean;
  } = {}
): Promise<T> {
  const { revalidate = 300, cacheKey, bypassCache = false } = options;
  const key = cacheKey || url;

  if (!bypassCache) {
    try {
      const cached = apiCache.getOrSet<T>(
        key,
        async () => {
          try {
            const res = await fetch(url, {
              next: revalidate ? { revalidate } : undefined,
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });

            if (!res.ok) {
              // Handle specific HTTP errors
              if (res.status === 403) {
                throw new Error('API access forbidden. Check API key or rate limits.');
              }
              if (res.status === 401) {
                throw new Error('API authentication failed. Check API key.');
              }
              if (res.status === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
              }
              if (res.status === 404) {
                throw new Error('Data not found for this request.');
              }
              throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
            }

            return res.json();
          } catch (fetchError) {
            console.error('Cache fetch failed, falling back to direct fetch:', fetchError);
            throw fetchError;
          }
        },
        revalidate * 1000 // Convert seconds to milliseconds
      );
      return cached;
    } catch (error) {
      console.error('Cache system failed, falling back to direct fetch:', error);
    }
  }

  // Fallback to direct fetch
  try {
    const res = await fetch(url, {
      next: revalidate ? { revalidate } : undefined,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      // Handle specific HTTP errors
      if (res.status === 403) {
        throw new Error('API access forbidden. Check API key or rate limits.');
      }
      if (res.status === 401) {
        throw new Error('API authentication failed. Check API key.');
      }
      if (res.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      if (res.status === 404) {
        throw new Error('Data not found for this request.');
      }
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Cache the result even for fallback requests
    if (!bypassCache) {
      try {
        apiCache.set(key, data, revalidate * 1000);
      } catch (cacheError) {
        console.warn('Failed to cache fallback result:', cacheError);
      }
    }

    return data;
  } catch (error) {
    console.error('Direct fetch failed:', error);
    throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Request deduplication hook
export function useDedupedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
) {
  return apiCache.getOrSet<T>(key, fetcher, ttl);
}

// Batch multiple requests
export async function batchRequests<T>(
  requests: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>
): Promise<T[]> {
  const promises = requests.map(({ key, fetcher, ttl }) =>
    apiCache.getOrSet(key, fetcher, ttl)
  );
  return Promise.all(promises);
}

// Preload cache data
export async function preloadCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
): Promise<void> {
  try {
    await apiCache.getOrSet(key, fetcher, ttl);
  } catch (error) {
    console.warn(`Failed to preload cache for ${key}:`, error);
  }
}
