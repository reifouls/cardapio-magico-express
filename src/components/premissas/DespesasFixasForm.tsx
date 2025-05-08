
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from "@/lib/utils";
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';

// Define proper types
type DespesaFixa = {
  id: string;
  nome_despesa: string;
  tipo: string;
  valor: number;
};

export default function DespesasFixasForm() {
  const [novaDespesa, setNovaDespesa] = useState<Partial<DespesaFixa>>({
    nome_despesa: '',
    tipo: 'Custos de Ocupação',
    valor: 0
  });

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

  const tiposDespesas = [
    { value: 'Custos de Ocupação', label: 'Custos de Ocupação' },
    { value: 'Custos de Pessoas', label: 'Custos de Pessoas' },
    { value: 'Despesas Administrativas', label: 'Despesas Administrativas' },
    { value: 'Despesas Financeiras', label: 'Despesas Financeiras' }
  ];

  const calculatedTotalDespesas = React.useMemo(() => {
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
              {tiposDespesas.map((tipo) => (
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
