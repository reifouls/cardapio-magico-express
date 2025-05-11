import { useEffect } from 'react';
import { PerformanceMonitor } from '../lib/monitoring/performance';

export function usePerformance(operation: string) {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.start(operation);

    return () => {
      monitor.end(operation);
    };
  }, [operation]);
}
