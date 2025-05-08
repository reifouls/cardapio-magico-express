
import React, { useState } from 'react';
import { useSupabaseQuery } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartPie, 
  ChartBar, 
  Grid2x2 
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ProdutoPopularidade = Tables<'produtos'> & {
  popularidade?: { nivel: number };
  categoria?: { nome: string };
};

export default function Engenharia() {
  const [activeTab, setActiveTab] = useState('tabela');

  const { data: produtos, isLoading } = useSupabaseQuery<'produtos', ProdutoPopularidade[]>(
    'produtos',
    ['engenharia'],
    { 
      select: '*, popularidade(*), categoria:categoria_id(nome)',
      order: 'nome'
    }
  );

  // Prepare data for charts
  const produtosProcessados = React.useMemo(() => {
    if (!produtos) return [];
    
    return produtos.map(produto => {
      const popularidade = produto.popularidade?.nivel || 0;
      
      // Classify products using Engineering Matrix
      let classificacao = 'Indefinido';
      const margem = produto.margem || 0;
      
      if (margem >= 0.5 && popularidade >= 7) {
        classificacao = 'Star';
      } else if (margem >= 0.5 && popularidade < 7) {
        classificacao = 'Puzzle';
      } else if (margem < 0.5 && popularidade >= 7) {
        classificacao = 'Plow Horse';
      } else if (margem < 0.5 && popularidade < 7) {
        classificacao = 'Dog';
      }
      
      return {
        ...produto,
        popularidade_nivel: popularidade,
        classificacao
      };
    });
  }, [produtos]);

  // Prepare pie chart data
  const pieChartData = React.useMemo(() => {
    const categorias: Record<string, { valor: number, count: number }> = {};
    
    produtosProcessados.forEach(produto => {
      const categoria = produto.classificacao || 'Indefinido';
      if (!categorias[categoria]) {
        categorias[categoria] = { valor: 0, count: 0 };
      }
      categorias[categoria].valor += produto.preco_definido || 0;
      categorias[categoria].count += 1;
    });
    
    return Object.entries(categorias).map(([name, data]) => ({
      name,
      value: data.count
    }));
  }, [produtosProcessados]);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Prepare bar chart data - margin by category
  const barChartData = React.useMemo(() => {
    const categorias: Record<string, { margem: number, count: number }> = {};
    
    produtosProcessados.forEach(produto => {
      const categoria = produto.categoria?.nome || 'Sem categoria';
      if (!categorias[categoria]) {
        categorias[categoria] = { margem: 0, count: 0 };
      }
      categorias[categoria].margem += produto.margem || 0;
      categorias[categoria].count += 1;
    });
    
    return Object.entries(categorias).map(([name, data]) => ({
      name,
      margem: data.count > 0 ? (data.margem / data.count) : 0
    }));
  }, [produtosProcessados]);

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const
    },
    {
      header: "Categoria",
      accessorKey: (row: typeof produtosProcessados[0]) => row.categoria?.nome || "-"
    },
    {
      header: "Custo",
      accessorKey: "custo_por_porcao" as const,
      cell: (row: typeof produtosProcessados[0]) => formatCurrency(row.custo_por_porcao || 0)
    },
    {
      header: "Preço",
      accessorKey: "preco_definido" as const,
      cell: (row: typeof produtosProcessados[0]) => formatCurrency(row.preco_definido || 0)
    },
    {
      header: "Margem",
      accessorKey: "margem" as const,
      cell: (row: typeof produtosProcessados[0]) => formatarPercentual(row.margem || 0)
    },
    {
      header: "Popularidade",
      accessorKey: "popularidade_nivel" as const,
      cell: (row: typeof produtosProcessados[0]) => {
        const nivel = row.popularidade_nivel || 0;
        return (
          <div className="flex items-center">
            <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(nivel / 10) * 100}%` }}
              ></div>
            </div>
            <span>{nivel}/10</span>
          </div>
        );
      }
    },
    {
      header: "Classificação",
      accessorKey: "classificacao" as const,
      cell: (row: typeof produtosProcessados[0]) => {
        const classificacao = row.classificacao || 'Indefinido';
        let bgColor = 'bg-gray-200';
        
        switch (classificacao) {
          case 'Star':
            bgColor = 'bg-yellow-200';
            break;
          case 'Puzzle':
            bgColor = 'bg-blue-200';
            break;
          case 'Plow Horse':
            bgColor = 'bg-green-200';
            break;
          case 'Dog':
            bgColor = 'bg-red-200';
            break;
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
            {classificacao}
          </span>
        );
      }
    }
  ];

  return (
    <>
      <PageHeader 
        title="Engenharia de Cardápio" 
        description="Análise de desempenho dos produtos"
      />
      
      <Tabs 
        defaultValue="tabela" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tabela" className="flex items-center gap-2">
            <Grid2x2 className="h-4 w-4" /> Tabela
          </TabsTrigger>
          <TabsTrigger value="pizza" className="flex items-center gap-2">
            <ChartPie className="h-4 w-4" /> Gráfico de Pizza
          </TabsTrigger>
          <TabsTrigger value="barras" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" /> Gráfico de Barras
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tabela">
          <Card>
            <CardHeader>
              <CardTitle>Produtos e Classificação</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={produtosProcessados || []}
                columns={columns}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pizza">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Classificação</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="barras">
          <Card>
            <CardHeader>
              <CardTitle>Margem Média por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="margem" fill="#8884d8" name="Margem Média" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
