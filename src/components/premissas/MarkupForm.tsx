
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatarPercentual } from "@/lib/utils";
import { Save } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

type Markup = {
  id: string;
  percentual_custos_fixos: number; // 0-1
  percentual_impostos: number; // 0-1
  percentual_delivery: number; // 0-1
  markup_loja: number;
  markup_delivery: number;
  markup_ponderado: number;
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
    percentual_custos_fixos_input: string;
    percentual_impostos_input: string;
    percentual_delivery_input: string;
    markup_loja: number;
    markup_delivery: number;
    markup_ponderado: number;
  }>({
    percentual_custos_fixos_input: '30',
    percentual_impostos_input: '9',
    percentual_delivery_input: '15',
    markup_loja: 2.5,
    markup_delivery: 3.0,
    markup_ponderado: 2.65
  });

  useEffect(() => {
    if (markup) {
      setFormData({
        percentual_custos_fixos_input: String(markup.percentual_custos_fixos * 100),
        percentual_impostos_input: String(markup.percentual_impostos * 100),
        percentual_delivery_input: String(markup.percentual_delivery * 100),
        markup_loja: markup.markup_loja,
        markup_delivery: markup.markup_delivery,
        markup_ponderado: markup.markup_ponderado
      });
    }
  }, [markup]);

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
    const percentualCustosFixos = parseFloat(formData.percentual_custos_fixos_input) / 100 || 0;
    const percentualImpostos = parseFloat(formData.percentual_impostos_input) / 100 || 0;
    const percentualDelivery = parseFloat(formData.percentual_delivery_input) / 100 || 0;
    
    // Calcula markup da loja (formula exemplo)
    const markupLoja = 1 / (1 - percentualCustosFixos - percentualImpostos);
    
    // Calcula markup de delivery (considera taxas adicionais)
    const markupDelivery = 1 / (1 - percentualCustosFixos - percentualImpostos - percentualDelivery);
    
    // Calcula markup ponderado (exemplo: 70% loja, 30% delivery)
    const markupPonderado = (markupLoja * 0.7) + (markupDelivery * 0.3);
    
    setFormData(prev => ({
      ...prev,
      markup_loja: parseFloat(markupLoja.toFixed(2)),
      markup_delivery: parseFloat(markupDelivery.toFixed(2)),
      markup_ponderado: parseFloat(markupPonderado.toFixed(2))
    }));
  }, [formData.percentual_custos_fixos_input, formData.percentual_impostos_input, formData.percentual_delivery_input]);

  const handleSaveMarkup = async () => {
    const percentualCustosFixos = parseFloat(formData.percentual_custos_fixos_input) / 100 || 0;
    const percentualImpostos = parseFloat(formData.percentual_impostos_input) / 100 || 0;
    const percentualDelivery = parseFloat(formData.percentual_delivery_input) / 100 || 0;
    
    const saveData = {
      percentual_custos_fixos: percentualCustosFixos,
      percentual_impostos: percentualImpostos,
      percentual_delivery: percentualDelivery,
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
            <strong>Fórmula Geral:</strong> Markup = 1 / (1 - % Custos Fixos - % Impostos - % Taxas Adicionais)
          </p>
        </AlertDescription>
      </Alert>
      
      {isLoadingMarkup ? (
        <div className="text-center py-4">Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="percentual_custos_fixos">% Custos Fixos</Label>
            <Input
              id="percentual_custos_fixos"
              type="number"
              min="1"
              max="100"
              value={formData.percentual_custos_fixos_input}
              onChange={(e) => setFormData({
                ...formData,
                percentual_custos_fixos_input: e.target.value
              })}
            />
            <p className="text-xs text-muted-foreground">
              {formatarPercentual(parseFloat(formData.percentual_custos_fixos_input) / 100 || 0)}
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
            <Label htmlFor="percentual_delivery">% Vendas Delivery</Label>
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
              Valor calculado automaticamente
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
              Valor calculado automaticamente
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
