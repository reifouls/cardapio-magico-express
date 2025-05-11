import { useEffect, useState } from 'react';
import { PerformanceMonitor } from '@/lib/monitoring/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      const operations = ['page-load', 'data-fetch', 'render'];
      const newMetrics = operations.reduce((acc, op) => {
        acc[op] = monitor.getMetrics(op);
        return acc;
      }, {} as Record<string, any>);
      setMetrics(newMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-background/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(metrics).map(([operation, data]) => (
          <div key={operation} className="mb-2">
            <div className="text-xs font-medium">{operation}</div>
            <div className="text-xs text-muted-foreground">
              Avg: {data.avg.toFixed(2)}ms | Min: {data.min.toFixed(2)}ms | Max: {data.max.toFixed(2)}ms
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
