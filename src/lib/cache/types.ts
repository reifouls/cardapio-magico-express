export interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiry: number;
  }