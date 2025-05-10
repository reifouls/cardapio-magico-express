
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
  percentual_delivery: number;
  markup_loja: number;
  markup_delivery: number;
  markup_ponderado: number;
  margem_lucro_desejada: number;
  faturamento_desejado: number;
  mix_vendas_loja: number;
  mix_vendas_delivery: number;
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
    percentual_delivery_input: string;
    margem_lucro_desejada_input: string;
    markup_loja: number;
    markup_delivery: number;
    markup_ponderado: number;
    percentual_custos_fixos: number;
    mix_vendas_loja: number;
    mix_vendas_delivery: number;
  }>({
    faturamento_desejado: 10000,
    percentual_impostos_input: '9',
    percentual_delivery_input: '15',
    margem_lucro_desejada_input: '10',
    markup_loja: 2.0,
    markup_delivery: 2.5,
    markup_ponderado: 2.15,
    percentual_custos_fixos: 0.3,
    mix_vendas_loja: 70,
    mix_vendas_delivery: 30
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
        percentual_delivery_input: String((markup.percentual_delivery || 0.15) * 100),
        margem_lucro_desejada_input: String((markup.margem_lucro_desejada || 0.1) * 100),
        markup_loja: markup.markup_loja || 2.0,
        markup_delivery: markup.markup_delivery || 2.5,
        markup_ponderado: markup.markup_ponderado || 2.15,
        percentual_custos_fixos: markup.percentual_custos_fixos || 0.3,
        mix_vendas_loja: markup.mix_vendas_loja !== undefined ? markup.mix_vendas_loja : 70,
        mix_vendas_delivery: markup.mix_vendas_delivery !== undefined ? markup.mix_vendas_delivery : 30
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

  const { update: updateMarkup, insert: insertMarkup } = useSupabaseMutation<'premissas_markup'>(
    'premissas_markup',
    {
      onSuccessMessage: 'Markup salvo com sucesso!',
      queryKeyToInvalidate: ['markup']
    }
  );

  // Calcula o markup ponderado baseado no mix de vendas
  useEffect(() => {
    const ponderado = (formData.markup_loja * (formData.mix_vendas_loja / 100)) + 
                     (formData.markup_delivery * (formData.mix_vendas_delivery / 100));
    
    setFormData(prev => ({
      ...prev,
      markup_ponderado: parseFloat(ponderado.toFixed(2))
    }));
  }, [formData.markup_loja, formData.markup_delivery, formData.mix_vendas_loja, formData.mix_vendas_delivery]);

  // Atualiza o mix de delivery quando o mix de loja mudar
  const handleMixLojaChange = (value: number[]) => {
    const mixLoja = value[0];
    setFormData(prev => ({
      ...prev,
      mix_vendas_loja: mixLoja,
      mix_vendas_delivery: 100 - mixLoja
    }));
  };

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
    const percentualDelivery = parseFloat(formData.percentual_delivery_input) / 100 || 0;
    const margemLucroDesejada = parseFloat(formData.margem_lucro_desejada_input) / 100 || 0;
    
    const saveData = {
      percentual_custos_fixos: formData.percentual_custos_fixos,
      percentual_impostos: percentualImpostos,
      percentual_delivery: percentualDelivery,
      margem_lucro_desejada: margemLucroDesejada,
      faturamento_desejado: formData.faturamento_desejado,
      markup_loja: formData.markup_loja,
      markup_delivery: formData.markup_delivery,
      markup_ponderado: formData.markup_ponderado,
      mix_vendas_loja: formData.mix_vendas_loja,
      mix_vendas_delivery: formData.mix_vendas_delivery
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
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-medium">Como o markup é calculado:</p>
          <p className="text-sm mt-1">O markup é uma multiplicação aplicada sobre o custo para determinar o preço de venda. 
          É calculado considerando custos fixos, impostos e, no caso do delivery, taxas extras.</p>
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
              <Label htmlFor="markup_loja">Markup Loja</Label>
              <Input
                id="markup_loja"
                type="number"
                min="1"
                step="0.1"
                value={formData.markup_loja}
                onChange={(e) => setFormData({
                  ...formData,
                  markup_loja: parseFloat(e.target.value) || 1
                })}
              />
              <div className="flex items-center gap-2">
                <Badge className={getMarkupScenario(formData.markup_loja).color}>
                  {getMarkupScenario(formData.markup_loja).text}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="markup_delivery">Markup Delivery</Label>
              <Input
                id="markup_delivery"
                type="number"
                min="1"
                step="0.1"
                value={formData.markup_delivery}
                onChange={(e) => setFormData({
                  ...formData,
                  markup_delivery: parseFloat(e.target.value) || 1
                })}
              />
              <div className="flex items-center gap-2">
                <Badge className={getMarkupScenario(formData.markup_delivery).color}>
                  {getMarkupScenario(formData.markup_delivery).text}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <Label>Mix de Vendas</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Loja</span>
                  <span className="text-sm">{formData.mix_vendas_loja}%</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Delivery</span>
                  <span className="text-sm">{formData.mix_vendas_delivery}%</span>
                </div>
              </div>
            </div>
            <Slider
              value={[formData.mix_vendas_loja]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleMixLojaChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% Loja</span>
              <span>100% Loja</span>
            </div>
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
            <div className="flex items-center gap-2">
              <Badge className={getMarkupScenario(formData.markup_ponderado).color}>
                {getMarkupScenario(formData.markup_ponderado).text}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Baseado no mix: {formData.mix_vendas_loja}% loja + {formData.mix_vendas_delivery}% delivery
              </span>
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
                <div>Preço Delivery:</div>
                <div>{formatCurrency(produtoExemplo.custoPorPorcao * formData.markup_delivery)}</div>
                <div>Preço Ponderado:</div>
                <div>{formatCurrency(produtoExemplo.custoPorPorcao * formData.markup_ponderado)}</div>
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
