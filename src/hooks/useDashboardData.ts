
import { useCache } from './useCache';
import { DashboardStatsProps } from '../components/dashboard/dashboard-stats-types';

export function useDashboardData(): [DashboardStatsProps | null, boolean, Error | null] {
  return useCache<DashboardStatsProps>(
    'dashboard-stats',
    async () => {
      // Aqui você implementará a lógica para buscar os dados do dashboard
      // Por enquanto, retornaremos dados mockados
      return {
        totalProdutos: 0,
        totalIngredientes: 0,
        mediaMargemProdutos: 0,
        totalCombos: 0,
        totalVendas: 0,
        receitaTotal: 0,
      };
    },
    5 * 60 * 1000 // 5 minutos
  );
}
