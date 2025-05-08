
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/dashboard/dashboard-cards";
import { RecentesList } from "@/components/dashboard/recentes-list";
import { formatCurrency, formatarPercentual } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";

export default function HomePage() {
  const { data: statsData = { 
    totalProdutos: 0,
    totalIngredientes: 0,
    mediaMargemProdutos: 0,
    totalCombos: 0,
    totalVendas: 0,
    receitaTotal: 0
  }, isLoading: statsLoading } = useQuery({
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

  const { data: sugestoes = [], isLoading: sugestoesLoading } = useQuery({
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

  const margemChartData = [
    { name: 'Alta Margem', value: 40 },
    { name: 'Média Margem', value: 30 },
    { name: 'Baixa Margem', value: 30 },
  ];
  
  const popularidadeChartData = [
    { name: 'Alta', value: 40 },
    { name: 'Média', value: 35 },
    { name: 'Baixa', value: 25 },
  ];
  
  const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo ao Cardápio Mágico Express. Gerencie suas fichas técnicas e otimize sua precificação.
      </p>

      <DashboardStats {...statsData} />

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
            { 
              header: "Produto", 
              accessorKey: "produtos.nome",
              cell: (item) => item.produtos?.nome || "N/A"
            },
            { header: "Tipo", accessorKey: "tipo" },
            { header: "Status", accessorKey: "status" }
          ]}
          emptyMessage="Nenhuma sugestão disponível."
          viewAllHref="/engenharia"
        />
      </div>

      <Tabs defaultValue="margem" className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-2">
          <TabsTrigger value="margem">Distribuição de Margem</TabsTrigger>
          <TabsTrigger value="popularidade">Popularidade</TabsTrigger>
        </TabsList>
        <TabsContent value="margem" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Margem</CardTitle>
              <CardDescription>Visão geral da distribuição dos produtos por margem</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={margemChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {margemChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="popularidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Popularidade</CardTitle>
              <CardDescription>Visão geral da distribuição dos produtos por popularidade</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popularidadeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {popularidadeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos com maior margem
            </CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarPercentual(0.62)}</div>
            <p className="text-xs text-muted-foreground">
              Café especial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos com menor margem
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarPercentual(0.18)}</div>
            <p className="text-xs text-muted-foreground">
              Sanduíche de frango
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produto mais vendido
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128 un</div>
            <p className="text-xs text-muted-foreground">
              Café coado
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
