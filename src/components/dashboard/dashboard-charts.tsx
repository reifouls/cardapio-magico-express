
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { 
  MargemChartData, 
  PopularidadeChartData,
  useMargemChartData, 
  usePopularidadeChartData 
} from "@/hooks/useChartsData";

const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

interface ChartProps {
  data: MargemChartData[] | PopularidadeChartData[];
  title: string;
  description: string;
}

const PieChartComponent: React.FC<ChartProps> = ({ data, title, description }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
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
  );
};

export const DashboardCharts: React.FC = () => {
  const { data: margemData = [], isLoading: isLoadingMargem } = useMargemChartData();
  const { data: popularidadeData = [], isLoading: isLoadingPopularidade } = usePopularidadeChartData();

  return (
    <Tabs defaultValue="margem" className="w-full">
      <TabsList className="w-full mb-4 grid grid-cols-2">
        <TabsTrigger value="margem">Distribuição de Margem</TabsTrigger>
        <TabsTrigger value="popularidade">Popularidade</TabsTrigger>
      </TabsList>
      <TabsContent value="margem" className="space-y-4">
        <PieChartComponent 
          data={margemData} 
          title="Distribuição por Margem"
          description="Visão geral da distribuição dos produtos por margem"
        />
      </TabsContent>
      <TabsContent value="popularidade" className="space-y-4">
        <PieChartComponent 
          data={popularidadeData} 
          title="Distribuição por Popularidade"
          description="Visão geral da distribuição dos produtos por popularidade"
        />
      </TabsContent>
    </Tabs>
  );
};
