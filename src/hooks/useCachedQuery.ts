'use client';
import { useCallback, useRef, useState } from 'react';


interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 30_000; // 30 seconds

const cache = new Map<string, CacheEntry<any>>();

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL
) {
  const [data, setData] = useState<T | null>(() => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < ttl) return entry.data;
    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetch = useCallback(
    async (force = false) => {
      if (fetchingRef.current) return;
      const cached = cache.get(key);
      if (!force && cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        cache.set(key, { data: result, timestamp: Date.now() });
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [key, fetcher, ttl]
  );

  const invalidate = useCallback(() => {
    cache.delete(key);
  }, [key]);

  return { data, loading, error, fetch, invalidate };
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export function usePagination(initialPageSize = 20) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: initialPageSize,
    total: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination((p) => ({ ...p, total }));
  }, []);

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const from = pagination.page * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  return { pagination, setPage, setTotal, totalPages, from, to };
}
