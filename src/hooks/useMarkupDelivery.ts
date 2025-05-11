
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
  faturamento_desejado: number;
  markup_loja: number;
  markup_ponderado: number;
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
  const saveMarkupDelivery = async (data: Partial<MarkupDelivery>) => {
    try {
      // Create a complete data object with required fields
      const completeData = {
        // Ensure all required fields are present
        percentual_custos_fixos: data.percentual_custos_fixos ?? markup?.percentual_custos_fixos ?? 0,
        percentual_impostos: data.percentual_impostos ?? markup?.percentual_impostos ?? 0,
        percentual_delivery: data.percentual_delivery ?? markup?.percentual_delivery ?? 0,
        markup_loja: data.markup_loja ?? markup?.markup_loja ?? 2.0,
        markup_delivery: data.markup_delivery ?? markup?.markup_delivery ?? 2.5,
        markup_ponderado: data.markup_ponderado ?? markup?.markup_ponderado ?? 2.0,
        // Optional fields
        id: markup?.id,
        rateio_custos_fixos_criterio: data.rateio_custos_fixos_criterio ?? markup?.rateio_custos_fixos_criterio ?? 'percentual_fixo',
        rateio_custos_fixos_percentual: data.rateio_custos_fixos_percentual ?? markup?.rateio_custos_fixos_percentual ?? 30,
        taxa_marketplace: data.taxa_marketplace ?? markup?.taxa_marketplace ?? 15,
        custo_embalagem_percentual: data.custo_embalagem_percentual ?? markup?.custo_embalagem_percentual ?? 3,
        outros_custos_delivery_percentual: data.outros_custos_delivery_percentual ?? markup?.outros_custos_delivery_percentual ?? 0,
        margem_lucro_desejada: data.margem_lucro_desejada ?? markup?.margem_lucro_desejada ?? 0.1,
        faturamento_desejado: data.faturamento_desejado ?? markup?.faturamento_desejado ?? 10000
      };
      
      if (markup?.id) {
        await updateMarkup({
          id: markup.id,
          data: completeData
        });
        return true;
      } else {
        await insertMarkup(completeData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving markup delivery:", error);
      return false;
    }
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
