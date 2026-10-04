import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Runs `load` on mount, again whenever the app comes back to the foreground
 * (the day may have changed overnight), and on demand via `reload`.
 * `load` must be stable (wrap it in useCallback).
 */
export function useLoader<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);

  const reload = useCallback(
    () =>
      load().then(
        (value) => {
          setData(value);
          setError(undefined);
        },
        (e: unknown) => setError(e),
      ),
    [load],
  );

  useEffect(() => {
    // Ignore results that arrive after the screen is gone.
    let active = true;
    const run = () =>
      load().then(
        (value) => {
          if (!active) return;
          setData(value);
          setError(undefined);
        },
        (e: unknown) => {
          if (active) setError(e);
        },
      );

    void run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [load]);

  return { data, error, reload };
}
