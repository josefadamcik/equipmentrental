/**
 * Generic React hook for data fetching.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => getAvailableEquipment(), []);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiError } from '../types/api';
import { ApiRequestError } from '../api/client';

export interface UseApiResult<T> {
  /** The fetched data, or null if not yet loaded or an error occurred. */
  data: T | null;
  /** True while the fetch is in flight. */
  loading: boolean;
  /** The most recent error, or null if the last fetch succeeded. */
  error: ApiError | null;
  /** Manually trigger a re-fetch. */
  refetch: () => void;
}

/**
 * Fetches data by calling `fetcher` whenever any value in `deps` changes (like
 * useEffect). Provides loading and error states, and a `refetch` callback.
 *
 * @param fetcher - A function that returns a Promise<T>. Should be stable or
 *                  wrapped in useCallback to avoid infinite loops.
 * @param deps    - Optional dependency array passed to the internal useEffect.
 *                  Defaults to [] (run once on mount).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  // A counter that is incremented on every manual refetch call, used to
  // re-trigger the effect without changing external deps.
  const [refetchIndex, setRefetchIndex] = useState<number>(0);

  // Keep a ref to the latest fetcher so the effect closure does not capture
  // a stale version.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcherRef.current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (err instanceof ApiRequestError) {
            setError(err.body);
          } else if (err instanceof Error) {
            setError({
              error: {
                code: 'NETWORK_ERROR',
                message: err.message,
              },
            });
          } else {
            setError({
              error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
              },
            });
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchIndex, ...deps]);

  const refetch = useCallback(() => {
    setRefetchIndex((n) => n + 1);
  }, []);

  return { data, loading, error, refetch };
}
