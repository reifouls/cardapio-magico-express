
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MargemChartData {
  name: string;
  value: number;
  percentage: number;
}

export interface PopularidadeChartData {
  name: string;
  value: number;
  percentage: number;
}

export interface ProdutosIndicadoresData {
  maiorMargem: {
    id: string;
    nome: string;
    margem: number;
  } | null;
  menorMargem: {
    id: string;
    nome: string;
    margem: number;
  } | null;
  maisVendido: {
    produto_id: string;
    quantidade_total: number;
    produtos: {
      nome: string;
    } | null;
  } | null;
}

export const useMargemChartData = () => {
  return useQuery<MargemChartData[]>({
    queryKey: ["dashboard", "margem-chart"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, margem")
        .not("margem", "is", null);
      
      if (!data || data.length === 0) {
        // Dados fictícios para quando não houver dados reais
        return [
          { name: 'Alta Margem (>50%)', value: 3, percentage: 50 },
          { name: 'Média Margem (30-50%)', value: 2, percentage: 33.33 },
          { name: 'Baixa Margem (<30%)', value: 1, percentage: 16.67 },
        ];
      }
      
      // Categoriza produtos por faixas de margem
      let altaMargem = 0;
      let mediaMargem = 0;
      let baixaMargem = 0;
      
      data.forEach(item => {
        const margem = item.margem;
        if (margem >= 0.5) {
          altaMargem++;
        } else if (margem >= 0.3 && margem < 0.5) {
          mediaMargem++;
        } else {
          baixaMargem++;
        }
      });
      
      const total = data.length;
      
      return [
        { name: 'Alta Margem (>50%)', value: altaMargem, percentage: (altaMargem / total) * 100 },
        { name: 'Média Margem (30-50%)', value: mediaMargem, percentage: (mediaMargem / total) * 100 },
        { name: 'Baixa Margem (<30%)', value: baixaMargem, percentage: (baixaMargem / total) * 100 },
      ];
    }
  });
};

export const usePopularidadeChartData = () => {
  return useQuery<PopularidadeChartData[]>({
    queryKey: ["dashboard", "popularidade-chart"],
    queryFn: async () => {
      const { data } = await supabase
        .from("popularidade")
        .select("id, nivel");
      
      if (!data || data.length === 0) {
        // Dados fictícios para quando não houver dados reais
        return [
          { name: 'Alta (>80%)', value: 4, percentage: 50 },
          { name: 'Média (50-80%)', value: 3, percentage: 37.5 },
          { name: 'Baixa (<50%)', value: 1, percentage: 12.5 },
        ];
      }
      
      // Categoriza produtos por nível de popularidade
      let alta = 0;
      let media = 0;
      let baixa = 0;
      
      data.forEach(item => {
        const nivel = item.nivel;
        if (nivel >= 8) {
          alta++;
        } else if (nivel >= 5 && nivel < 8) {
          media++;
        } else {
          baixa++;
        }
      });
      
      const total = data.length || 1;
      
      return [
        { name: 'Alta (>80%)', value: alta, percentage: (alta / total) * 100 },
        { name: 'Média (50-80%)', value: media, percentage: (media / total) * 100 },
        { name: 'Baixa (<50%)', value: baixa, percentage: (baixa / total) * 100 },
      ];
    }
  });
};

export const useProdutoIndicadores = () => {
  return useQuery<ProdutosIndicadoresData>({
    queryKey: ["dashboard", "indicadores-produtos"],
    queryFn: async () => {
      // Tentar obter produto com maior margem
      const { data: maiorMargemData } = await supabase
        .from("produtos")
        .select("id, nome, margem")
        .not("margem", "is", null)
        .order("margem", { ascending: false })
        .limit(1);

      // Tentar obter produto com menor margem
      const { data: menorMargemData } = await supabase
        .from("produtos")
        .select("id, nome, margem")
        .not("margem", "is", null)
        .gt("margem", 0) // Apenas margens positivas
        .order("margem", { ascending: true })
        .limit(1);

      // Tentar obter produto mais vendido
      const { data: vendasData } = await supabase
        .from("vendas")
        .select(`produto_id, quantidade, produtos(nome)`)
        .not("produto_id", "is", null);
        
      // Handle aggregation in JavaScript instead
      const vendasPorProduto: Record<string, any> = {};
      if (vendasData) {
        vendasData.forEach((venda: any) => {
          if (!vendasPorProduto[venda.produto_id]) {
            vendasPorProduto[venda.produto_id] = {
              produto_id: venda.produto_id,
              quantidade_total: 0,
              produtos: venda.produtos
            };
          }
          vendasPorProduto[venda.produto_id].quantidade_total += venda.quantidade;
        });
      }
      
      // Convert to array and find highest quantity
      const vendasAgregadas = Object.values(vendasPorProduto);
      const maisVendido = vendasAgregadas.length > 0 ?
        vendasAgregadas.reduce((max, current) => 
          max.quantidade_total > current.quantidade_total ? max : current
        , vendasAgregadas[0]) : null;
      
      return {
        maiorMargem: maiorMargemData?.[0] || null,
        menorMargem: menorMargemData?.[0] || null,
        maisVendido: maisVendido
      };
    }
  });
};
