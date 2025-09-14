import { useCallback, useEffect, useRef } from 'react';

// Reusable guards to prevent infinite spin/tumble loops and orphaned timeouts.
// This file exports a generic hook and contains no game-specific state, so it can
// be safely included in the build even if unused.

export function useSpinGuards() {
  const spinLockRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  const safeSetTimeout = useCallback((cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    spinLockRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      clearAll();
    };
  }, [clearAll]);

  return { spinLockRef, timeoutsRef, safeSetTimeout, clearAll };
}

export default useSpinGuards;