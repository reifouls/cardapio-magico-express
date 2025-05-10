
import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency } from "@/lib/utils";
import { COLORS } from './hooks/useDespesasFixas';

type DespesaFixa = {
  id: string;
  nome_despesa: string;
  tipo: string;
  valor: number;
};

type CategoriaAgrupada = {
  nome: string;
  valor: number;
  percentual: number;
  despesas: DespesaFixa[];
  cor: string;
};

type DespesaChartProps = {
  despesasFixas: DespesaFixa[] | undefined;
  categorias: { value: string; label: string }[];
  onCategoriaClick: (nome: string) => void;
};

type DespesaDetalheChartProps = {
  despesas: DespesaFixa[];
  categoria: string;
};

export const DespesasChart: React.FC<DespesaChartProps> = ({ 
  despesasFixas, 
  categorias,
  onCategoriaClick 
}) => {
  // Agrupar despesas por categoria e calcular totais
  const despesasPorCategoria = useMemo(() => {
    if (!despesasFixas || despesasFixas.length === 0) return [];
    
    const categoriasMap = categorias.map(cat => ({
      nome: cat.value,
      valor: 0,
      despesas: [] as DespesaFixa[]
    }));
    
    // Agrupar despesas por categoria
    despesasFixas.forEach(despesa => {
      const categoria = categoriasMap.find(c => c.nome === despesa.tipo);
      if (categoria) {
        categoria.valor += Number(despesa.valor);
        categoria.despesas.push(despesa);
      }
    });
    
    // Calcular o total para percentuais
    const total = categoriasMap.reduce((sum, cat) => sum + cat.valor, 0);
    
    // Formatar para o gráfico
    return categoriasMap.map((cat, index) => ({
      nome: cat.nome,
      valor: cat.valor,
      percentual: total > 0 ? (cat.valor / total) * 100 : 0,
      despesas: cat.despesas,
      cor: COLORS[index % COLORS.length]
    }));
  }, [despesasFixas, categorias]);

  // Dados formatados para o gráfico
  const dadosGrafico = useMemo(() => 
    despesasPorCategoria.map(cat => ({
      name: cat.nome,
      value: cat.valor,
      percentual: cat.percentual,
      color: cat.cor
    }))
  , [despesasPorCategoria]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dadosGrafico}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent.toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => onCategoriaClick(data.name)}
          >
            {dadosGrafico.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [formatCurrency(Number(value)), 'Valor Total']} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-muted-foreground mt-2">
        Clique em um segmento para ver os detalhes das despesas
      </div>
    </div>
  );
};

export const DespesasDetalheChart: React.FC<DespesaDetalheChartProps> = ({
  despesas,
  categoria
}) => {
  // Calcular o total da categoria
  const totalCategoria = useMemo(() => {
    return despesas.reduce((sum, despesa) => sum + despesa.valor, 0);
  }, [despesas]);

  // Dados formatados para o gráfico detalhado
  const dadosGraficoDetalhado = useMemo(() => {
    if (despesas.length === 0) return [];
    
    return despesas.map((despesa, index) => ({
      name: despesa.nome_despesa,
      value: despesa.valor,
      percentual: totalCategoria > 0 ? (despesa.valor / totalCategoria) * 100 : 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [despesas, totalCategoria]);

  if (despesas.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        Não há despesas nesta categoria
      </p>
    );
  }

  return (
    <>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dadosGraficoDetalhado}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${percent.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dadosGraficoDetalhado.map((entry, index) => (
                <Cell key={`detail-cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [formatCurrency(Number(value)), 'Valor']} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="pt-2 text-right">
        <p className="font-medium">Total {categoria}: 
          <span className="ml-2 font-bold">
            {formatCurrency(totalCategoria)}
          </span>
        </p>
      </div>
    </>
  );
};
