
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStatsProps } from "@/components/dashboard/dashboard-stats-types";

export const useDashboardStats = () => {
  return useQuery<DashboardStatsProps>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      // Obter contagem de produtos
      const { count: produtosCount } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true });

      // Obter contagem de ingredientes
      const { count: ingredientesCount } = await supabase
        .from("ingredientes")
        .select("*", { count: "exact", head: true });
      
      // Obter média de margem
      const { data: margemData } = await supabase
        .from("produtos")
        .select("margem")
        .not("margem", "is", null);
      
      const mediaMargemProdutos = margemData && margemData.length > 0
        ? margemData.reduce((acc, item) => acc + (item.margem || 0), 0) / margemData.length
        : 0;

      // Obter contagem de combos
      const { count: combosCount } = await supabase
        .from("combos")
        .select("*", { count: "exact", head: true });

      // Obter vendas
      const { data: vendasData } = await supabase
        .from("vendas")
        .select("*");

      const totalVendas = vendasData?.length || 0;
      const receitaTotal = vendasData?.reduce((acc, item) => acc + (item.preco_aplicado * item.quantidade), 0) || 0;

      return {
        totalProdutos: produtosCount || 0,
        totalIngredientes: ingredientesCount || 0,
        mediaMargemProdutos,
        totalCombos: combosCount || 0,
        totalVendas,
        receitaTotal
      };
    }
  });
};
