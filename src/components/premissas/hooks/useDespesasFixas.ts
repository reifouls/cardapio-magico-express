
import { useState, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';

type DespesaFixa = {
  id: string;
  nome_despesa: string;
  tipo: string;
  valor: number;
};

export const useDespesasFixas = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState<Partial<DespesaFixa>>({
    nome_despesa: '',
    tipo: 'Custos de Ocupação',
    valor: 0
  });

  // Fetch despesas fixas
  const { data: despesasFixas, isLoading: isLoadingDespesas } = useSupabaseQuery<
    'premissas_despesas_fixas',
    false,
    DespesaFixa[]
  >(
    'premissas_despesas_fixas',
    ['despesas'],
    { order: 'nome_despesa' }
  );

  // Mutations for despesas fixas
  const { insert: insertDespesa, remove: deleteDespesa } = useSupabaseMutation<'premissas_despesas_fixas'>(
    'premissas_despesas_fixas',
    {
      onSuccessMessage: 'Despesa salva com sucesso!',
      queryKeyToInvalidate: ['despesas']
    }
  );

  // Calculate total despesas
  const totalDespesas = useMemo(() => {
    return despesasFixas?.reduce((sum, despesa) => sum + (despesa.valor || 0), 0) || 0;
  }, [despesasFixas]);

  // Add new despesa
  const handleAddDespesa = async () => {
    if (!novaDespesa.nome_despesa || !novaDespesa.valor) return;
    
    await insertDespesa({
      nome_despesa: novaDespesa.nome_despesa,
      tipo: novaDespesa.tipo || 'Custos de Ocupação',
      valor: novaDespesa.valor
    });
    
    setNovaDespesa({ nome_despesa: '', tipo: 'Custos de Ocupação', valor: 0 });
  };

  // Delete despesa
  const handleDeleteDespesa = async (despesa: DespesaFixa) => {
    if (window.confirm(`Deseja realmente excluir a despesa "${despesa.nome_despesa}"?`)) {
      await deleteDespesa(despesa.id);
    }
  };

  return {
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
  };
};

// Constant for categorias de despesas
export const CATEGORIAS_DESPESAS = [
  { value: 'Custos de Ocupação', label: 'Custos de Ocupação' },
  { value: 'Custos de Pessoas', label: 'Custos de Pessoas' },
  { value: 'Despesas Administrativas', label: 'Despesas Administrativas' },
  { value: 'Despesas Financeiras', label: 'Despesas Financeiras' }
];

// Define colors for chart
export const COLORS = ['#16a34a', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
