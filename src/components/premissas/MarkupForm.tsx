
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatarPercentual, formatCurrency } from "@/lib/utils";
import { Save } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

type Markup = {
  id: string;
  percentual_custos_fixos: number;
  percentual_impostos: number;
  percentual_delivery: number;
  markup_loja: number;
  markup_delivery: number;
  markup_ponderado: number;
  margem_lucro_desejada: number;
  faturamento_desejado: number;
};

export default function MarkupForm() {
  const { data: markup, isLoading: isLoadingMarkup } = useSupabaseQuery<
    'premissas_markup',
    true,
    Markup | null
  >(
    'premissas_markup',
    ['markup'],
    { single: true }
  );

  const [formData, setFormData] = useState<{
    faturamento_desejado_input: string;
    percentual_impostos_input: string;
    percentual_delivery_input: string;
    margem_lucro_desejada_input: string;
    markup_loja: number;
    markup_delivery: number;
    markup_ponderado: number;
    percentual_custos_fixos: number;
  }>({
    faturamento_desejado_input: '10000',
    percentual_impostos_input: '9',
    percentual_delivery_input: '15',
    margem_lucro_desejada_input: '10',
    markup_loja: 2.5,
    markup_delivery: 3.0,
    markup_ponderado: 2.65,
    percentual_custos_fixos: 0.3
  });

  // Buscar o total de despesas fixas para calcular o % sobre faturamento
  const { data: despesasFixas } = useSupabaseQuery<
    'premissas_despesas_fixas',
    false,
    { valor: number }[]
  >(
    'premissas_despesas_fixas',
    ['despesas-total'],
    { select: 'valor' }
  );

  // Calcular total de despesas fixas
  const totalDespesasFixas = React.useMemo(() => {
    return despesasFixas?.reduce((sum, despesa) => sum + (despesa.valor || 0), 0) || 0;
  }, [despesasFixas]);

  useEffect(() => {
    if (markup) {
      setFormData({
        faturamento_desejado_input: String(markup.faturamento_desejado || 10000),
        percentual_impostos_input: String(markup.percentual_impostos * 100),
        percentual_delivery_input: String(markup.percentual_delivery * 100),
        margem_lucro_desejada_input: String((markup.margem_lucro_desejada || 0.1) * 100),
        markup_loja: markup.markup_loja,
        markup_delivery: markup.markup_delivery,
        markup_ponderado: markup.markup_ponderado,
        percentual_custos_fixos: markup.percentual_custos_fixos
      });
    } else if (totalDespesasFixas > 0) {
      // Calcular percentual de custos fixos a partir do faturamento desejado
      const faturamentoDesejado = parseFloat(formData.faturamento_desejado_input);
      if (faturamentoDesejado > 0) {
        const percentualCustosFixos = totalDespesasFixas / faturamentoDesejado;
        setFormData(prev => ({
          ...prev,
          percentual_custos_fixos: percentualCustosFixos
        }));
      }
    }
  }, [markup, totalDespesasFixas]);

  // Recalcular o percentual de custos fixos quando o faturamento desejado mudar
  useEffect(() => {
    if (totalDespesasFixas > 0) {
      const faturamentoDesejado = parseFloat(formData.faturamento_desejado_input) || 1;
      const percentualCustosFixos = totalDespesasFixas / faturamentoDesejado;
      setFormData(prev => ({
        ...prev,
        percentual_custos_fixos: percentualCustosFixos
      }));
    }
  }, [formData.faturamento_desejado_input, totalDespesasFixas]);

  const { update: updateMarkup, insert: insertMarkup } = useSupabaseMutation<'premissas_markup'>(
    'premissas_markup',
    {
      onSuccessMessage: 'Markup salvo com sucesso!',
      queryKeyToInvalidate: ['markup']
    }
  );

  // Calcula os markups baseados nos percentuais
  useEffect(() => {
    // Converte percentuais de string para número e divide por 100 para obter decimal
    const percentualCustosFixos = formData.percentual_custos_fixos || 0;
    const percentualImpostos = parseFloat(formData.percentual_impostos_input) / 100 || 0;
    const percentualDelivery = parseFloat(formData.percentual_delivery_input) / 100 || 0;
    const margemLucroDesejada = parseFloat(formData.margem_lucro_desejada_input) / 100 || 0;
    
    // Calcula markup da loja (formula exemplo)
    const markupLoja = 1 / (1 - percentualCustosFixos - percentualImpostos - margemLucroDesejada);
    
    // Calcula markup de delivery (considera taxas adicionais)
    const markupDelivery = 1 / (1 - percentualCustosFixos - percentualImpostos - margemLucroDesejada - percentualDelivery);
    
    // Calcula markup ponderado (exemplo: 70% loja, 30% delivery)
    const markupPonderado = (markupLoja * 0.7) + (markupDelivery * 0.3);
    
    setFormData(prev => ({
      ...prev,
      markup_loja: parseFloat(markupLoja.toFixed(2)),
      markup_delivery: parseFloat(markupDelivery.toFixed(2)),
      markup_ponderado: parseFloat(markupPonderado.toFixed(2))
    }));
  }, [formData.percentual_custos_fixos, formData.percentual_impostos_input, formData.percentual_delivery_input, formData.margem_lucro_desejada_input]);

  const handleSaveMarkup = async () => {
    const percentualImpostos = parseFloat(formData.percentual_impostos_input) / 100 || 0;
    const percentualDelivery = parseFloat(formData.percentual_delivery_input) / 100 || 0;
    const margemLucroDesejada = parseFloat(formData.margem_lucro_desejada_input) / 100 || 0;
    const faturamentoDesejado = parseFloat(formData.faturamento_desejado_input) || 0;
    
    const saveData = {
      percentual_custos_fixos: formData.percentual_custos_fixos,
      percentual_impostos: percentualImpostos,
      percentual_delivery: percentualDelivery,
      margem_lucro_desejada: margemLucroDesejada,
      faturamento_desejado: faturamentoDesejado,
      markup_loja: formData.markup_loja,
      markup_delivery: formData.markup_delivery,
      markup_ponderado: formData.markup_ponderado
    };

    if (markup?.id) {
      await updateMarkup({
        id: markup.id,
        data: saveData
      });
    } else {
      await insertMarkup(saveData);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-medium">Como o markup é calculado:</p>
          <p className="text-sm mt-1">O markup é uma multiplicação aplicada sobre o custo para determinar o preço de venda. 
          É calculado considerando custos fixos, impostos e, no caso do delivery, taxas extras.</p>
          <p className="text-sm mt-1">
            <strong>Fórmula Geral:</strong> Markup = 1 / (1 - % Custos Fixos - % Impostos - % Margem Desejada - % Taxas Adicionais)
          </p>
        </AlertDescription>
      </Alert>
      
      {isLoadingMarkup ? (
        <div className="text-center py-4">Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="faturamento_desejado">Faturamento Desejado (R$)</Label>
            <Input
              id="faturamento_desejado"
              type="number"
              min="1"
              value={formData.faturamento_desejado_input}
              onChange={(e) => setFormData({
                ...formData,
                faturamento_desejado_input: e.target.value
              })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total de despesas fixas: {formatCurrency(totalDespesasFixas)}</span>
              <span>
                % sobre faturamento: {formatarPercentual(formData.percentual_custos_fixos)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="margem_lucro_desejada">Margem de Lucro Desejada (%)</Label>
            <Input
              id="margem_lucro_desejada"
              type="number"
              min="0"
              max="100"
              value={formData.margem_lucro_desejada_input}
              onChange={(e) => setFormData({
                ...formData,
                margem_lucro_desejada_input: e.target.value
              })}
            />
            <p className="text-xs text-muted-foreground">
              {formatarPercentual(parseFloat(formData.margem_lucro_desejada_input) / 100 || 0)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="percentual_impostos">% Impostos</Label>
            <Input
              id="percentual_impostos"
              type="number"
              min="0"
              max="100"
              value={formData.percentual_impostos_input}
              onChange={(e) => setFormData({
                ...formData,
                percentual_impostos_input: e.target.value
              })}
            />
            <p className="text-xs text-muted-foreground">
              {formatarPercentual(parseFloat(formData.percentual_impostos_input) / 100 || 0)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="percentual_delivery">% Taxas Delivery</Label>
            <Input
              id="percentual_delivery"
              type="number"
              min="0"
              max="100"
              value={formData.percentual_delivery_input}
              onChange={(e) => setFormData({
                ...formData,
                percentual_delivery_input: e.target.value
              })}
            />
            <p className="text-xs text-muted-foreground">
              {formatarPercentual(parseFloat(formData.percentual_delivery_input) / 100 || 0)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="markup_loja">Markup Loja (calculado)</Label>
            <Input
              id="markup_loja"
              type="number"
              value={formData.markup_loja}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              Aplicado para vendas no local
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="markup_delivery">Markup Delivery (calculado)</Label>
            <Input
              id="markup_delivery"
              type="number"
              value={formData.markup_delivery}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              Aplicado para vendas de delivery
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="markup_ponderado">Markup Ponderado (calculado)</Label>
            <Input
              id="markup_ponderado"
              type="number"
              value={formData.markup_ponderado}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              70% loja + 30% delivery
            </p>
          </div>
          
          <div className="col-span-2 pt-4">
            <Button onClick={handleSaveMarkup} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Salvar Markup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
