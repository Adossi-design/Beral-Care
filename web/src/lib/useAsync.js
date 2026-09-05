import { useState, useEffect, useCallback, useRef } from 'react';
import { errorMessage } from './api';

/**
 * Data fetching with loading, error, and refetch.
 *
 * Every list screen needs the same four things; without this each one grows its
 * own slightly different copy, and half of them forget to handle the error case.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (mounted.current) setData(result);
      return result;
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
      return undefined;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}

/** Runs several requests together, returning them as a keyed object. */
export function useAsyncAll(map, deps = []) {
  const keys = Object.keys(map);
  const fnsRef = useRef(map);
  fnsRef.current = map;

  return useAsync(async () => {
    const results = await Promise.all(keys.map((k) => fnsRef.current[k]()));
    return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
  }, deps);
}
