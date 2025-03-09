import { useState, useEffect } from 'react';

/**
 * Hook to track component hydration state
 * @returns boolean indicating if component is hydrated
 */
export function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Set hydrated state after component mounts
    setIsHydrated(true);

    // Verify React Query cache is ready if it's being used
    const queryCache = (window as any).__REACT_QUERY_CACHE__;
    if (queryCache && !queryCache.isFetching) {
      setIsHydrated(true);
    }

    // Check for any Next.js specific hydration errors
    const hydrationErrors = (window as any).__NEXT_HYDRATION_ERRORS__;
    if (hydrationErrors && hydrationErrors.length > 0) {
      console.error('Hydration errors detected:', hydrationErrors);
      setIsHydrated(false);
    }
  }, []);

  return isHydrated;
}