import { useCallback } from 'react';

import { useNotice } from './components/Notice';
import { FAILED } from './messages';

/**
 * Runs an action of the user (save, rename, relapse...) and, if it throws
 * (the database, the phone), says so gently instead of failing in silence
 * (ADR 0024). Errors the domain returns as results are shown by the screens
 * themselves, where they happen.
 */
export function useSafeAction() {
  const notice = useNotice();
  return useCallback(
    async <T>(action: () => Promise<T>, message: string = FAILED): Promise<T | undefined> => {
      try {
        return await action();
      } catch {
        notice(message);
        return undefined;
      }
    },
    [notice],
  );
}
