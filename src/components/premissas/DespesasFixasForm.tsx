
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from "@/lib/utils";
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDespesasFixas, CATEGORIAS_DESPESAS } from './hooks/useDespesasFixas';
import { DespesasChart, DespesasDetalheChart } from './DespesasCharts';

export default function DespesasFixasForm() {
  // Use the custom hook for all despesas logic
  const {
    despesasFixas,
    isLoadingDespesas,
    novaDespesa,
    setNovaDespesa,
    handleAddDespesa,
    handleDeleteDespesa,
    totalDespesas,
    categoriaAtiva,
    setCategoriaAtiva,
    detalhesAbertos,
    setDetalhesAbertos
  } = useDespesasFixas();

  const handleCategoriaClick = (nome: string) => {
    setCategoriaAtiva(nome);
    setDetalhesAbertos(true);
  };

  // Get despesas for the active category
  const despesasDaCategoria = React.useMemo(() => {
    if (!categoriaAtiva || !despesasFixas) return [];
    return despesasFixas.filter(despesa => despesa.tipo === categoriaAtiva);
  }, [categoriaAtiva, despesasFixas]);

  // Table columns definition
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
      cell: (info: { row: { original: { valor: number } } }) => formatCurrency(info.row.original.valor)
    }
  ];

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
          <DespesasChart 
            despesasFixas={despesasFixas} 
            categorias={CATEGORIAS_DESPESAS}
            onCategoriaClick={handleCategoriaClick}
          />
        </CardContent>
      </Card>

      {/* Diálogo com detalhes da categoria */}
      <Dialog open={detalhesAbertos} onOpenChange={setDetalhesAbertos}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes - {categoriaAtiva}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <DespesasDetalheChart 
              despesas={despesasDaCategoria}
              categoria={categoriaAtiva || ''} 
            />
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
            {formatCurrency(totalDespesas)}
          </span>
        </p>
      </div>
    </div>
  );
}
