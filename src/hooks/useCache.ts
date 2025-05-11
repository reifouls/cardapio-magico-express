import { useState, useEffect } from 'react';
import { Cache } from '../lib/cache';

export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expiry?: number
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cache = Cache.getInstance();
    const cachedData = cache.get<T>(key);

    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    fetchFn()
      .then((result) => {
        cache.set(key, result, expiry);
        setData(result);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key, fetchFn, expiry]);

  return [data, loading, error];
}