import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface UrlPaginationState {
  page: number;
  limit: number;
}

export interface UrlFilterState {
  search: string;
  status: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | undefined;
}

/**
 * Hook for synchronizing component state with URL search parameters.
 * Essential for History, Audit logs, and Report filtering.
 */
export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = useCallback(
    (key: string, defaultValue: string = ''): string => {
      return searchParams.get(key) ?? defaultValue;
    },
    [searchParams]
  );

  const getNumberParam = useCallback(
    (key: string, defaultValue: number): number => {
      const val = searchParams.get(key);
      if (!val) return defaultValue;
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    },
    [searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string | number | null | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null || value === undefined || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const pagination: UrlPaginationState = useMemo(
    () => ({
      page: getNumberParam('page', 1),
      limit: getNumberParam('limit', 20),
    }),
    [getNumberParam]
  );

  const filters: UrlFilterState = useMemo(
    () => ({
      search: getParam('search', ''),
      status: getParam('status', ''),
      sortBy: getParam('sortBy', 'timestamp'),
      sortOrder: (getParam('sortOrder', 'desc') as 'asc' | 'desc') || 'desc',
    }),
    [getParam]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        // Preserve pagination defaults if desired, or reset cleanly
        if (prev.has('limit')) {
          next.set('limit', prev.get('limit')!);
        }
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return {
    searchParams,
    getParam,
    getNumberParam,
    setParam,
    setParams,
    pagination,
    filters,
    resetFilters,
  };
}
