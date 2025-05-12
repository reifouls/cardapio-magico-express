import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatarPercentual, formatCurrency } from "@/lib/utils";
import { Save, Info } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';

type Markup = {
  id: string;
  percentual_custos_fixos: number;
  percentual_impostos: number;
  markup_loja: number;
  margem_lucro_desejada: number;
  faturamento_desejado: number;
  markup_delivery: number;
  markup_ponderado: number;
  mix_vendas_loja: number;
  mix_vendas_delivery: number;
  percentual_delivery: number;
  rateio_custos_fixos_criterio: string;
  rateio_custos_fixos_percentual: number;
  taxa_marketplace: number;
  custo_embalagem_percentual: number;
  outros_custos_delivery_percentual: number;
};

// Constants for markup scenarios
const MARKUP_SCENARIOS = {
  insuficiente: { max: 1.8, color: 'bg-red-100 text-red-800', text: 'Insuficiente - Risco de prejuízo' },
  aceitavel: { min: 1.8, max: 2.7, color: 'bg-yellow-100 text-yellow-800', text: 'Aceitável' },
  saudavel: { min: 2.7, color: 'bg-green-100 text-green-800', text: 'Saudável' }
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
    faturamento_desejado: number;
    percentual_impostos_input: string;
    margem_lucro_desejada_input: string;
    markup_loja: number;
    percentual_custos_fixos: number;
  }>({
    faturamento_desejado: 10000,
    percentual_impostos_input: '9',
    margem_lucro_desejada_input: '10',
    markup_loja: 2.0,
    percentual_custos_fixos: 0.3
  });

  const [produtoExemplo, setProdutoExemplo] = useState({
    custoPorPorcao: 10.00
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
        faturamento_desejado: markup.faturamento_desejado || 10000,
        percentual_impostos_input: String((markup.percentual_impostos || 0.09) * 100),
        margem_lucro_desejada_input: String((markup.margem_lucro_desejada || 0.1) * 100),
        markup_loja: markup.markup_loja || 2.0,
        percentual_custos_fixos: markup.percentual_custos_fixos || 0.3
      });
    } else if (totalDespesasFixas > 0) {
      // Calcular percentual de custos fixos a partir do faturamento desejado
      const percentualCustosFixos = totalDespesasFixas / formData.faturamento_desejado;
      setFormData(prev => ({
        ...prev,
        percentual_custos_fixos: percentualCustosFixos
      }));
    }
  }, [markup, totalDespesasFixas]);

  // Recalcular o percentual de custos fixos quando o faturamento desejado mudar
  useEffect(() => {
    if (totalDespesasFixas > 0) {
      const percentualCustosFixos = totalDespesasFixas / formData.faturamento_desejado;
      setFormData(prev => ({
        ...prev,
        percentual_custos_fixos: percentualCustosFixos
      }));
    }
  }, [formData.faturamento_desejado, totalDespesasFixas]);

  // Calcular markup loja quando os percentuais mudarem
  useEffect(() => {
    const percentualImpostos = parseFloat(formData.percentual_impostos_input) / 100 || 0;
    const margemLucroDesejada = parseFloat(formData.margem_lucro_desejada_input) / 100 || 0;
    const soma = formData.percentual_custos_fixos + percentualImpostos + margemLucroDesejada;
    
    if (soma >= 1) {
      setFormData(prev => ({ ...prev, markup_loja: Infinity }));
    } else {
      const markup = 1 / (1 - soma);
      setFormData(prev => ({ ...prev, markup_loja: markup }));
    }
  }, [formData.percentual_impostos_input, formData.margem_lucro_desejada_input, formData.percentual_custos_fixos]);

  const { update: updateMarkup, insert: insertMarkup } = useSupabaseMutation<'premissas_markup'>(
    'premissas_markup',
    {
      onSuccessMessage: 'Markup salvo com sucesso!',
      queryKeyToInvalidate: ['markup']
    }
  );

  const getMarkupScenario = (markup: number) => {
    if (markup < MARKUP_SCENARIOS.insuficiente.max) {
      return MARKUP_SCENARIOS.insuficiente;
    } else if (markup >= MARKUP_SCENARIOS.aceitavel.min && markup < MARKUP_SCENARIOS.aceitavel.max) {
      return MARKUP_SCENARIOS.aceitavel;
    } else {
      return MARKUP_SCENARIOS.saudavel;
    }
  };

  const handleSaveMarkup = async () => {
    const percentualImpostos = parseFloat(formData.percentual_impostos_input) / 100 || 0;
    const margemLucroDesejada = parseFloat(formData.margem_lucro_desejada_input) / 100 || 0;
    
    const saveData = {
      percentual_custos_fixos: formData.percentual_custos_fixos,
      percentual_impostos: percentualImpostos,
      margem_lucro_desejada: margemLucroDesejada,
      faturamento_desejado: formData.faturamento_desejado,
      markup_loja: formData.markup_loja,
      // Preserve existing delivery and mixed values
      markup_delivery: markup?.markup_delivery || 2.5,
      markup_ponderado: markup?.markup_ponderado || 2.15,
      mix_vendas_loja: markup?.mix_vendas_loja || 70,
      mix_vendas_delivery: markup?.mix_vendas_delivery || 30,
      percentual_delivery: markup?.percentual_delivery || 0.15,
      rateio_custos_fixos_criterio: markup?.rateio_custos_fixos_criterio || 'percentual_fixo',
      rateio_custos_fixos_percentual: markup?.rateio_custos_fixos_percentual || 30,
      taxa_marketplace: markup?.taxa_marketplace || 15,
      custo_embalagem_percentual: markup?.custo_embalagem_percentual || 3,
      outros_custos_delivery_percentual: markup?.outros_custos_delivery_percentual || 0
    };

    try {
      if (markup?.id) {
        await updateMarkup({
          id: markup.id,
          data: saveData
        });
      } else {
        await insertMarkup(saveData);
      }
    } catch (error) {
      console.error('Erro ao salvar markup:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-medium">Como o markup é calculado:</p>
          <p className="text-sm mt-1">O markup é uma multiplicação aplicada sobre o custo para determinar o preço de venda. 
          É calculado considerando custos fixos, impostos e sua margem de lucro desejada.</p>
          <p className="text-sm mt-1 font-medium">Para configurações de delivery, use a aba "Markup Delivery".</p>
        </AlertDescription>
      </Alert>
      
      {isLoadingMarkup ? (
        <div className="text-center py-4">Carregando...</div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="faturamento_desejado">Faturamento Desejado (R$)</Label>
              <Input
                id="faturamento_desejado"
                type="number"
                min="1"
                value={formData.faturamento_desejado}
                onChange={(e) => setFormData({
                  ...formData,
                  faturamento_desejado: parseFloat(e.target.value) || 0
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
              <Label htmlFor="markup_loja">Markup Loja</Label>
              <Input
                id="markup_loja"
                type="number"
                min="1"
                step="0.1"
                value={formData.markup_loja}
                readOnly
                className="bg-gray-50"
              />
              <div className="flex items-center gap-2">
                <Badge className={getMarkupScenario(formData.markup_loja).color}>
                  {getMarkupScenario(formData.markup_loja).text}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md space-y-4 border">
            <h3 className="font-medium">Cenários de Markup (fator)</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge className={MARKUP_SCENARIOS.insuficiente.color}>
                  &lt; 1.8
                </Badge>
                <span className="text-sm">{MARKUP_SCENARIOS.insuficiente.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={MARKUP_SCENARIOS.aceitavel.color}>
                  1.8 - 2.7
                </Badge>
                <span className="text-sm">{MARKUP_SCENARIOS.aceitavel.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={MARKUP_SCENARIOS.saudavel.color}>
                  &gt; 2.7
                </Badge>
                <span className="text-sm">{MARKUP_SCENARIOS.saudavel.text}</span>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Exemplo de aplicação:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p>Custo por porção: {formatCurrency(produtoExemplo.custoPorPorcao)}</p>
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Custo exemplo"
                    value={produtoExemplo.custoPorPorcao}
                    onChange={(e) => setProdutoExemplo({
                      custoPorPorcao: parseFloat(e.target.value) || 0
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>Preço Loja:</div>
                <div>{formatCurrency(produtoExemplo.custoPorPorcao * formData.markup_loja)}</div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
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
