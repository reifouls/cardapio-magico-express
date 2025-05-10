
import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from "@/lib/utils";
import { Plus, PieChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResponsiveContainer, PieChart as PieChartRecharts, Pie, Cell, Tooltip, Legend } from 'recharts';

// Define proper types
type DespesaFixa = {
  id: string;
  nome_despesa: string;
  tipo: string;
  valor: number;
};

const CATEGORIAS_DESPESAS = [
  { value: 'Custos de Ocupação', label: 'Custos de Ocupação' },
  { value: 'Custos de Pessoas', label: 'Custos de Pessoas' },
  { value: 'Despesas Administrativas', label: 'Despesas Administrativas' },
  { value: 'Despesas Financeiras', label: 'Despesas Financeiras' }
];

const COLORS = ['#16a34a', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export default function DespesasFixasForm() {
  const [novaDespesa, setNovaDespesa] = useState<Partial<DespesaFixa>>({
    nome_despesa: '',
    tipo: 'Custos de Ocupação',
    valor: 0
  });
  
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);

  const { data: despesasFixas, isLoading: isLoadingDespesas } = useSupabaseQuery<
    'premissas_despesas_fixas',
    false,
    DespesaFixa[]
  >(
    'premissas_despesas_fixas',
    ['despesas'],
    { order: 'nome_despesa' }
  );

  const { insert: insertDespesa, remove: deleteDespesa } = useSupabaseMutation<'premissas_despesas_fixas'>(
    'premissas_despesas_fixas',
    {
      onSuccessMessage: 'Despesa salva com sucesso!',
      queryKeyToInvalidate: ['despesas']
    }
  );

  const handleAddDespesa = async () => {
    if (!novaDespesa.nome_despesa || !novaDespesa.valor) return;
    await insertDespesa({
      nome_despesa: novaDespesa.nome_despesa,
      tipo: novaDespesa.tipo || 'Custos de Ocupação',
      valor: novaDespesa.valor
    });
    setNovaDespesa({ nome_despesa: '', tipo: 'Custos de Ocupação', valor: 0 });
  };

  const handleDeleteDespesa = async (despesa: DespesaFixa) => {
    if (window.confirm(`Deseja realmente excluir a despesa "${despesa.nome_despesa}"?`)) {
      await deleteDespesa(despesa.id);
    }
  };

  const despesasColumns = [
    {
      header: "Nome da Despesa",
      accessorKey: "nome_despesa"
    },
    {
      header: "Tipo",
      accessorKey: "tipo"
    },
    {
      header: "Valor Mensal",
      accessorKey: "valor",
      cell: (info: { row: { original: DespesaFixa } }) => formatCurrency(info.row.original.valor)
    }
  ];

  // Agrupar despesas por categoria e calcular totais
  const despesasPorCategoria = useMemo(() => {
    if (!despesasFixas || despesasFixas.length === 0) return [];
    
    const categorias = CATEGORIAS_DESPESAS.map(cat => ({
      nome: cat.value,
      valor: 0,
      despesas: [] as DespesaFixa[]
    }));
    
    // Agrupar despesas por categoria
    despesasFixas.forEach(despesa => {
      const categoria = categorias.find(c => c.nome === despesa.tipo);
      if (categoria) {
        categoria.valor += Number(despesa.valor);
        categoria.despesas.push(despesa);
      }
    });
    
    // Calcular o total para percentuais
    const total = categorias.reduce((sum, cat) => sum + cat.valor, 0);
    
    // Formatar para o gráfico
    return categorias.map((cat, index) => ({
      nome: cat.nome,
      valor: cat.valor,
      percentual: total > 0 ? (cat.valor / total) * 100 : 0,
      despesas: cat.despesas,
      cor: COLORS[index % COLORS.length]
    }));
  }, [despesasFixas]);

  // Dados formatados para o gráfico principal
  const dadosGrafico = useMemo(() => 
    despesasPorCategoria.map(cat => ({
      name: cat.nome,
      value: cat.valor,
      percentual: cat.percentual,
      color: cat.cor
    }))
  , [despesasPorCategoria]);

  // Dados formatados para o gráfico detalhado de despesas por categoria
  const dadosGraficoDetalhado = useMemo(() => {
    if (!categoriaAtiva) return [];
    
    const categoria = despesasPorCategoria.find(cat => cat.nome === categoriaAtiva);
    if (!categoria || categoria.despesas.length === 0) return [];
    
    // Calcular o total da categoria
    const totalCategoria = categoria.despesas.reduce((sum, despesa) => sum + despesa.valor, 0);
    
    // Retornar dados formatados para o gráfico de pizza
    return categoria.despesas.map((despesa, index) => ({
      name: despesa.nome_despesa,
      value: despesa.valor,
      percentual: totalCategoria > 0 ? (despesa.valor / totalCategoria) * 100 : 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [categoriaAtiva, despesasPorCategoria]);

  // Despesas da categoria selecionada
  const despesasDaCategoria = useMemo(() => {
    if (!categoriaAtiva) return [];
    return despesasPorCategoria.find(cat => cat.nome === categoriaAtiva)?.despesas || [];
  }, [categoriaAtiva, despesasPorCategoria]);

  // Calcular valor total das despesas
  const calculatedTotalDespesas = useMemo(() => {
    return despesasFixas?.reduce((sum, despesa) => sum + (despesa.valor || 0), 0) || 0;
  }, [despesasFixas]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="nome_despesa">Nome da Despesa</Label>
          <Input
            id="nome_despesa"
            value={novaDespesa.nome_despesa || ''}
            onChange={(e) => setNovaDespesa({
              ...novaDespesa,
              nome_despesa: e.target.value
            })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tipo_despesa">Tipo</Label>
          <Select 
            value={novaDespesa.tipo || 'Custos de Ocupação'} 
            onValueChange={(value) => setNovaDespesa({
              ...novaDespesa,
              tipo: value
            })}
          >
            <SelectTrigger id="tipo_despesa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_DESPESAS.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="valor_despesa">Valor Mensal</Label>
          <Input
            id="valor_despesa"
            type="number"
            step="0.01"
            value={novaDespesa.valor || ''}
            onChange={(e) => setNovaDespesa({
              ...novaDespesa,
              valor: parseFloat(e.target.value) || 0
            })}
          />
        </div>
        
        <div className="col-span-4">
          <Button onClick={handleAddDespesa} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Despesa Fixa
          </Button>
        </div>
      </div>

      {/* Gráfico de Pizza para Despesas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Distribuição de Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChartRecharts>
                <Pie
                  data={dadosGrafico}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => {
                    setCategoriaAtiva(data.name);
                    setDetalhesAbertos(true);
                  }}
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
              </PieChartRecharts>
            </ResponsiveContainer>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Clique em um segmento para ver os detalhes das despesas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo com detalhes da categoria */}
      <Dialog open={detalhesAbertos} onOpenChange={setDetalhesAbertos}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes - {categoriaAtiva}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {despesasDaCategoria.length > 0 ? (
              <>
                {/* Gráfico de Pizza detalhado da categoria */}
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChartRecharts>
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
                    </PieChartRecharts>
                  </ResponsiveContainer>
                </div>
                <div className="pt-2 text-right">
                  <p className="font-medium">Total {categoriaAtiva}: 
                    <span className="ml-2 font-bold">
                      {formatCurrency(despesasDaCategoria.reduce((sum, d) => sum + d.valor, 0))}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                Não há despesas nesta categoria
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="pt-4">
        <DataTable 
          data={despesasFixas || []}
          columns={despesasColumns}
          onDelete={handleDeleteDespesa}
          isLoading={isLoadingDespesas}
        />
      </div>
      
      <div className="pt-4 text-right">
        <p className="font-medium">Total de Despesas Fixas: 
          <span className="ml-2 font-bold">
            {formatCurrency(calculatedTotalDespesas)}
          </span>
        </p>
      </div>
    </div>
  );
}
