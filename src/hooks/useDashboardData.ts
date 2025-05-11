
import { useCache } from './useCache';
import { DashboardStatsProps } from '../components/dashboard/dashboard-stats-types';
import { useDashboardStats } from './useDashboardStats';

export function useDashboardData(): [DashboardStatsProps | null, boolean, Error | null] {
  // This hook is kept for backward compatibility
  // It uses the new useDashboardStats hook internally
  
  const { data, isLoading, error } = useDashboardStats();
  
  return [
    data || null,
    isLoading,
    error || null
  ];
}
