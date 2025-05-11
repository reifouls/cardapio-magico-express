
import React from "react";
import { RecentesList } from "@/components/dashboard/recentes-list";
import { formatCurrency, formatarPercentual } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DashboardRecentItems: React.FC = () => {
  // Query para produtos recentes
  const { data: produtosRecentes = [], isLoading: produtosLoading } = useQuery({
    queryKey: ["produtos", "recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          id,
          nome,
          preco_definido,
          custo_por_porcao,
          margem,
          updated_at,
          categorias(nome)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  // Query para sugestões recentes
  const { data: sugestoesRaw = [], isLoading: sugestoesLoading } = useQuery({
    queryKey: ["sugestoes", "recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sugestoes")
        .select(`
          id,
          tipo,
          descricao,
          status,
          created_at,
          produto_id,
          produtos(nome)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });
  
  // Transform sugestoesRaw to match the expected format
  const sugestoes = sugestoesRaw.map(item => ({
    id: item.id,
    nome: item.produtos?.nome || 'N/A',
    valor: undefined,
    status: item.status,
    data: item.created_at,
    tipo: item.tipo
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <RecentesList
        title="Produtos Recentes"
        items={produtosRecentes}
        columns={[
          { header: "Nome", accessorKey: "nome" },
          { 
            header: "Preço", 
            accessorKey: "preco_definido",
            cell: (item) => formatCurrency(item.preco_definido)
          },
          { 
            header: "Margem", 
            accessorKey: "margem",
            cell: (item) => formatarPercentual(item.margem)
          }
        ]}
        emptyMessage="Nenhum produto cadastrado recentemente."
        viewAllHref="/fichas-tecnicas"
      />

      <RecentesList
        title="Sugestões"
        items={sugestoes}
        columns={[
          { header: "Produto", accessorKey: "nome" },
          { header: "Tipo", accessorKey: "tipo" },
          { header: "Status", accessorKey: "status" }
        ]}
        emptyMessage="Nenhuma sugestão disponível."
        viewAllHref="/engenharia"
      />
    </div>
  );
};
