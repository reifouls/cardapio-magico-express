
import { useState, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';

type MarkupDelivery = {
  id: string;
  percentual_custos_fixos: number;
  percentual_impostos: number;
  percentual_delivery: number;
  rateio_custos_fixos_criterio: 'percentual_fixo' | 'participacao_faturamento';
  rateio_custos_fixos_percentual: number;
  taxa_marketplace: number;
  custo_embalagem_percentual: number;
  outros_custos_delivery_percentual: number;
  markup_delivery: number;
  margem_lucro_desejada: number;
};

export function useMarkupDelivery() {
  // Fetch markup data including new delivery fields
  const { data: markup, isLoading } = useSupabaseQuery<
    'premissas_markup',
    true,
    MarkupDelivery | null
  >(
    'premissas_markup',
    ['markup-delivery'],
    { single: true }
  );

  // Fetch total despesas fixas to calculate rateio
  const { data: despesasFixas } = useSupabaseQuery<
    'premissas_despesas_fixas',
    false,
    { valor: number }[]
  >(
    'premissas_despesas_fixas',
    ['despesas-total'],
    { select: 'valor' }
  );

  // Calculate total despesas fixas
  const totalDespesasFixas = despesasFixas?.reduce(
    (sum, despesa) => sum + (despesa.valor || 0), 
    0
  ) || 0;

  // Database mutation hook
  const { update: updateMarkup, insert: insertMarkup } = useSupabaseMutation<'premissas_markup'>(
    'premissas_markup',
    {
      onSuccessMessage: 'Markup de delivery salvo com sucesso!',
      queryKeyToInvalidate: ['markup', 'markup-delivery']
    }
  );

  // Calculate the delivery markup based on all percentages
  const calculateDeliveryMarkup = (
    percentualCustosFixos: number,
    percentualImpostos: number,
    taxaMarketplace: number,
    custoEmbalagemPercentual: number,
    outrosCustosDeliveryPercentual: number,
    margemLucroDesejada: number
  ) => {
    // Sum of all percentages
    const totalPercentual = 
      percentualCustosFixos + 
      percentualImpostos + 
      taxaMarketplace + 
      custoEmbalagemPercentual + 
      outrosCustosDeliveryPercentual + 
      margemLucroDesejada;
    
    // Markup calculation: 1 / (1 - (total_percentual / 100))
    const markupDivisor = parseFloat((1 / (1 - (totalPercentual / 100))).toFixed(2));
    return isFinite(markupDivisor) ? markupDivisor : 0;
  };

  // Calculate allocated fixed costs based on criteria
  const calculateAlocatedFixedCosts = (
    criterio: 'percentual_fixo' | 'participacao_faturamento',
    percentual: number,
    faturamentoDesejado: number
  ) => {
    if (criterio === 'percentual_fixo') {
      return (totalDespesasFixas * (percentual / 100));
    } else {
      // If based on participation in total revenue, fixed costs are already proportional
      return totalDespesasFixas * (percentual / 100);
    }
  };

  // Calculate percentual of fixed costs over delivery revenue
  const calculateFixedCostsPercentage = (
    allocatedCosts: number,
    faturamentoDelivery: number
  ) => {
    return faturamentoDelivery > 0 ? 
      (allocatedCosts / faturamentoDelivery) * 100 : 0;
  };

  // Save markup delivery settings
  const saveMarkupDelivery = async (data: Omit<MarkupDelivery, 'id'>) => {
    if (markup?.id) {
      await updateMarkup({
        id: markup.id,
        data
      });
      return true;
    } else {
      await insertMarkup(data);
      return true;
    }
    return false;
  };

  return {
    markup,
    isLoading,
    totalDespesasFixas,
    calculateDeliveryMarkup,
    calculateAlocatedFixedCosts,
    calculateFixedCostsPercentage,
    saveMarkupDelivery
  };
}
