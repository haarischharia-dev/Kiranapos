import { useState, useEffect } from 'react';

export function useDelayedLoading(isLoading: boolean, delayMs = 150) {
  const [delayedLoading, setDelayedLoading] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setDelayedLoading(true);
      }, delayMs);
    } else {
      setDelayedLoading(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, delayMs]);

  return delayedLoading;
}
