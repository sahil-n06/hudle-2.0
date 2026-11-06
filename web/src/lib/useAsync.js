'use client';
import { useCallback, useEffect, useState } from 'react';

/** Runs an async loader whenever deps change; exposes { data, error, loading, reload }. */
export function useAsync(loader, deps) {
  const [state, setState] = useState({
    data: undefined,
    error: null,
    loading: true,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch(
        (error) =>
          active && setState({ data: undefined, error, loading: false }),
      );
    return () => {
      active = false;
    };
  }, [run]);

  useEffect(() => reload(), [reload]);
  return {
    ...state,
    reload,
    setData: (data) => setState((s) => ({ ...s, data })),
  };
}
