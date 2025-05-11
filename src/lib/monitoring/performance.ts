export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number>;
  private metrics: Map<string, number[]>;

  private constructor() {
    this.marks = new Map();
    this.metrics = new Map();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(operation: string): void {
    this.marks.set(operation, performance.now());
  }

  end(operation: string): number | null {
    const startTime = this.marks.get(operation);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(operation);

    // Armazenar métrica
    const metrics = this.metrics.get(operation) || [];
    metrics.push(duration);
    this.metrics.set(operation, metrics);

    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`Operation ${operation} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  async measure<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation);
      return result;
    } catch (error) {
      this.end(operation);
      throw error;
    }
  }

  getMetrics(operation: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } {
    const metrics = this.metrics.get(operation) || [];
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = metrics.reduce((a, b) => a + b, 0);
    return {
      avg: sum / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length,
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
  }
}
