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

// Add interface definitions for better type safety
interface VendaData {
  produto_id: string;
  quantidade: number;
  produtos: {
    nome: string;
  } | null;
}

interface VendaAgregada {
  produto_id: string;
  quantidade_total: number;
  produtos: {
    nome: string;
  } | null;
}

// Define stats interface for type safety
interface DashboardStatsData {
  totalProdutos: number;
  totalIngredientes: number;
  mediaMargemProdutos: number;
  totalCombos: number;
  totalVendas: number;
  receitaTotal: number;
}

export default function HomePage() {
  const { data: statsData = { 
    totalProdutos: 0,
    totalIngredientes: 0,
    mediaMargemProdutos: 0,
    totalCombos: 0,
    totalVendas: 0,
    receitaTotal: 0
  }, isLoading: statsLoading } = useQuery<DashboardStatsData>({
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

  // Carrega dados reais para os gráficos
  const { data: margemData = [], isLoading: isLoadingMargem } = useQuery({
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
  
  const { data: popularidadeData = [], isLoading: isLoadingPopularidade } = useQuery({
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
  
  // Transform sugestoes data to match the expected format for RecentesList
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
    nome: item.produtos?.nome || 'N/A',  // Use the product name as nome
    valor: undefined,                    // Not used for this list
    status: item.status,                 // Keep the status
    data: item.created_at,               // Use created_at as data
    tipo: item.tipo                      // Additional property
  }));

  // Query para obter produtos com maior e menor margem e produto mais vendido
  const { data: indicadoresProdutos = { 
    maiorMargem: null,
    menorMargem: null, 
    maisVendido: null 
  }} = useQuery({
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
      // Fix: Change the supabase query to properly aggregate the data without using group
      const { data: vendasData } = await supabase
        .from("vendas")
        .select(`produto_id, quantidade, produtos(nome)`)
        .not("produto_id", "is", null);
        
      // Handle aggregation in JavaScript instead
      const vendasPorProduto: Record<string, VendaAgregada> = {};
      if (vendasData) {
        (vendasData as VendaData[]).forEach(venda => {
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

  const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo ao Cardápio Mágico Express. Gerencie suas fichas técnicas e otimize sua precificação.
      </p>

      <DashboardStats 
        totalProdutos={statsData.totalProdutos}
        totalIngredientes={statsData.totalIngredientes}
        mediaMargemProdutos={statsData.mediaMargemProdutos}
        totalCombos={statsData.totalCombos}
        totalVendas={statsData.totalVendas}
        receitaTotal={statsData.receitaTotal}
      />

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
                      data={margemData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {margemData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} produto(s)`, 'Quantidade']} />
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
                      data={popularidadeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {popularidadeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} produto(s)`, 'Quantidade']} />
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
            {indicadoresProdutos.maiorMargem ? (
              <>
                <div className="text-2xl font-bold">
                  {formatarPercentual(indicadoresProdutos.maiorMargem.margem)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {indicadoresProdutos.maiorMargem.nome}
                </p>
              </>
            ) : (
              <div className="py-2 text-muted-foreground text-sm">Sem dados disponíveis</div>
            )}
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
            {indicadoresProdutos.menorMargem ? (
              <>
                <div className="text-2xl font-bold">
                  {formatarPercentual(indicadoresProdutos.menorMargem.margem)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {indicadoresProdutos.menorMargem.nome}
                </p>
              </>
            ) : (
              <div className="py-2 text-muted-foreground text-sm">Sem dados disponíveis</div>
            )}
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
            {indicadoresProdutos.maisVendido ? (
              <>
                <div className="text-2xl font-bold">
                  {indicadoresProdutos.maisVendido.quantidade_total} un
                </div>
                <p className="text-xs text-muted-foreground">
                  {indicadoresProdutos.maisVendido.produtos?.nome}
                </p>
              </>
            ) : (
              <div className="py-2 text-muted-foreground text-sm">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
