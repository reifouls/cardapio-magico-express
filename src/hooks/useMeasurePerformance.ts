import { useCallback } from 'react';
import { PerformanceMonitor } from '../lib/monitoring/performance';

export function useMeasurePerformance() {
  const monitor = PerformanceMonitor.getInstance();

  const measure = useCallback(
    async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
      return monitor.measure(operation, fn);
    },
    []
  );

  return measure;
}
