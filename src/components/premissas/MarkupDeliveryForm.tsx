import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatarPercentual, formatCurrency } from "@/lib/utils";
import { Save, Info, Calculator } from 'lucide-react';
import { useMarkupDelivery } from '@/hooks/useMarkupDelivery';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Constants for markup scenarios - same as in MarkupForm for consistency
const MARKUP_SCENARIOS = {
  insuficiente: { max: 1.8, color: 'bg-red-100 text-red-800', text: 'Insuficiente - Risco de prejuízo' },
  aceitavel: { min: 1.8, max: 2.7, color: 'bg-yellow-100 text-yellow-800', text: 'Aceitável' },
  saudavel: { min: 2.7, color: 'bg-green-100 text-green-800', text: 'Saudável' }
};

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function MarkupDeliveryForm() {
  const {
    markup,
    isLoading,
    totalDespesasFixas,
    calculateDeliveryMarkup,
    calculateAlocatedFixedCosts,
    calculateFixedCostsPercentage,
    saveMarkupDelivery
  } = useMarkupDelivery();

  const [formData, setFormData] = useState({
    // Rateio de custos fixos
    rateio_custos_fixos_criterio: 'percentual_fixo' as 'percentual_fixo' | 'participacao_faturamento',
    rateio_custos_fixos_percentual: 30,
    
    // Custos variáveis e faturamento
    faturamento_delivery: 10000,
    percentual_impostos: 9,
    taxa_marketplace: 15,
    custo_embalagem_percentual: 3,
    outros_custos_delivery_percentual: 0,
    
    // Margem de lucro
    margem_lucro_desejada: 10,
    
    // Valores calculados
    custos_fixos_alocados: 0,
    percentual_custos_fixos_sobre_faturamento: 0,
    total_percentuais: 0,
    markup_delivery: 0
  });

  const [produtoExemplo, setProdutoExemplo] = useState({
    custoPorPorcao: 10.00
  });

  // Load data from database
  useEffect(() => {
    if (markup) {
      setFormData({
        ...formData,
        rateio_custos_fixos_criterio: markup.rateio_custos_fixos_criterio || 'percentual_fixo',
        rateio_custos_fixos_percentual: markup.rateio_custos_fixos_percentual || 30,
        faturamento_delivery: markup.faturamento_desejado || 10000,
        percentual_impostos: (markup.percentual_impostos || 0.09) * 100,
        taxa_marketplace: markup.taxa_marketplace || 15,
        custo_embalagem_percentual: markup.custo_embalagem_percentual || 3,
        outros_custos_delivery_percentual: markup.outros_custos_delivery_percentual || 0,
        margem_lucro_desejada: (markup.margem_lucro_desejada || 0.1) * 100
      });
    }
  }, [markup]);

  // Update calculated values whenever inputs change
  useEffect(() => {
    // Calculate allocated fixed costs
    const custosFixosAlocados = calculateAlocatedFixedCosts(
      formData.rateio_custos_fixos_criterio,
      formData.rateio_custos_fixos_percentual,
      formData.faturamento_delivery
    );
    
    // Calculate fixed costs as a percentage of delivery revenue
    const percentualCustosFixos = calculateFixedCostsPercentage(
      custosFixosAlocados,
      formData.faturamento_delivery
    );
    
    // Calculate total percentages
    const totalPercentuais = 
      percentualCustosFixos + 
      formData.percentual_impostos + 
      formData.taxa_marketplace + 
      formData.custo_embalagem_percentual + 
      formData.outros_custos_delivery_percentual + 
      formData.margem_lucro_desejada;
    
    // Calculate markup
    const markupDelivery = calculateDeliveryMarkup(
      percentualCustosFixos,
      formData.percentual_impostos,
      formData.taxa_marketplace,
      formData.custo_embalagem_percentual,
      formData.outros_custos_delivery_percentual,
      formData.margem_lucro_desejada
    );
    
    setFormData(prev => ({
      ...prev,
      custos_fixos_alocados: custosFixosAlocados,
      percentual_custos_fixos_sobre_faturamento: percentualCustosFixos,
      total_percentuais: totalPercentuais,
      markup_delivery: markupDelivery
    }));
  }, [
    formData.rateio_custos_fixos_criterio,
    formData.rateio_custos_fixos_percentual,
    formData.faturamento_delivery,
    formData.percentual_impostos,
    formData.taxa_marketplace,
    formData.custo_embalagem_percentual,
    formData.outros_custos_delivery_percentual,
    formData.margem_lucro_desejada,
    totalDespesasFixas
  ]);

  // Create pie chart data
  const pieChartData = [
    { name: 'Custos Fixos', value: formData.percentual_custos_fixos_sobre_faturamento },
    { name: 'Impostos', value: formData.percentual_impostos },
    { name: 'Taxa Marketplace', value: formData.taxa_marketplace },
    { name: 'Custos de Embalagem', value: formData.custo_embalagem_percentual },
    { name: 'Outros Custos', value: formData.outros_custos_delivery_percentual },
    { name: 'Margem de Lucro', value: formData.margem_lucro_desejada }
  ];

  // Get markup scenario
  const getMarkupScenario = (markup: number) => {
    if (markup < MARKUP_SCENARIOS.insuficiente.max) {
      return MARKUP_SCENARIOS.insuficiente;
    } else if (markup >= MARKUP_SCENARIOS.aceitavel.min && markup < MARKUP_SCENARIOS.aceitavel.max) {
      return MARKUP_SCENARIOS.aceitavel;
    } else {
      return MARKUP_SCENARIOS.saudavel;
    }
  };

  // Handle form submission
  const handleSaveMarkup = async () => {
    await saveMarkupDelivery({
      percentual_custos_fixos: formData.percentual_custos_fixos_sobre_faturamento / 100,
      percentual_impostos: formData.percentual_impostos / 100,
      percentual_delivery: formData.taxa_marketplace / 100,
      rateio_custos_fixos_criterio: formData.rateio_custos_fixos_criterio,
      rateio_custos_fixos_percentual: formData.rateio_custos_fixos_percentual,
      taxa_marketplace: formData.taxa_marketplace,
      custo_embalagem_percentual: formData.custo_embalagem_percentual,
      outros_custos_delivery_percentual: formData.outros_custos_delivery_percentual,
      markup_delivery: formData.markup_delivery,
      margem_lucro_desejada: formData.margem_lucro_desejada / 100,
      faturamento_desejado: formData.faturamento_delivery
    });
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  // Fix for the PieChart tooltip formatter
  const tooltipFormatter = (value: any) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}%`;
    }
    return value ? `${value}%` : '0%';
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-medium">Markup Delivery Especializado</p>
          <p className="text-sm mt-1">
            Configure os parâmetros específicos para o canal de delivery, considerando taxas de marketplaces, 
            custos de embalagem e rateio adequado de despesas fixas.
          </p>
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : (
        <div className="space-y-8">
          {/* Seção 1: Rateio de Custos Fixos */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Rateio de Custos Fixos</h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-2 border">
              <div className="flex justify-between text-sm">
                <span>Total de despesas fixas:</span>
                <span className="font-medium">{formatCurrency(totalDespesasFixas)}</span>
              </div>
              
              <div className="space-y-4">
                <RadioGroup 
                  value={formData.rateio_custos_fixos_criterio} 
                  onValueChange={(value: 'percentual_fixo' | 'participacao_faturamento') => 
                    handleInputChange('rateio_custos_fixos_criterio', value)
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentual_fixo" id="percentual_fixo" />
                    <Label htmlFor="percentual_fixo">Percentual Fixo Manual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="participacao_faturamento" id="participacao_faturamento" />
                    <Label htmlFor="participacao_faturamento">Baseado na Participação Estimada no Faturamento</Label>
                  </div>
                </RadioGroup>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rateio_custos_fixos_percentual">
                      {formData.rateio_custos_fixos_criterio === 'percentual_fixo' 
                        ? '% dos Custos Fixos Alocados ao Delivery' 
                        : '% de Participação Estimada no Faturamento'}
                    </Label>
                    <Input
                      id="rateio_custos_fixos_percentual"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.rateio_custos_fixos_percentual}
                      onChange={(e) => handleInputChange('rateio_custos_fixos_percentual', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="faturamento_delivery">Faturamento Desejado para Delivery (R$)</Label>
                    <Input
                      id="faturamento_delivery"
                      type="number"
                      min="1"
                      value={formData.faturamento_delivery}
                      onChange={(e) => handleInputChange('faturamento_delivery', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-md border border-gray-200 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Custos fixos alocados ao delivery:</span>
                    <span className="font-medium">
                      {formatCurrency(formData.custos_fixos_alocados)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Percentual sobre faturamento delivery:</span>
                    <span className="font-medium">
                      {formatarPercentual(formData.percentual_custos_fixos_sobre_faturamento / 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Custos Variáveis do Delivery */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Custos Variáveis do Delivery</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="percentual_impostos">% Impostos sobre Vendas</Label>
                <Input
                  id="percentual_impostos"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentual_impostos}
                  onChange={(e) => handleInputChange('percentual_impostos', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {formatarPercentual(formData.percentual_impostos / 100)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxa_marketplace">% Taxa do Marketplace/Plataforma</Label>
                <Input
                  id="taxa_marketplace"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxa_marketplace}
                  onChange={(e) => handleInputChange('taxa_marketplace', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: iFood 27%, App próprio 5%
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custo_embalagem_percentual">% Custo de Embalagem</Label>
                <Input
                  id="custo_embalagem_percentual"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.custo_embalagem_percentual}
                  onChange={(e) => handleInputChange('custo_embalagem_percentual', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="outros_custos_delivery_percentual">% Outros Custos Variáveis</Label>
                <Input
                  id="outros_custos_delivery_percentual"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.outros_custos_delivery_percentual}
                  onChange={(e) => handleInputChange('outros_custos_delivery_percentual', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Margem de Lucro */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Margem de Lucro</h3>
            
            <div>
              <div className="space-y-2">
                <Label htmlFor="margem_lucro_desejada">Margem de Lucro Desejada para Delivery (%)</Label>
                <Input
                  id="margem_lucro_desejada"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.margem_lucro_desejada}
                  onChange={(e) => handleInputChange('margem_lucro_desejada', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {formatarPercentual(formData.margem_lucro_desejada / 100)}
                </p>
              </div>
            </div>
          </div>

          {/* Seção 4: Resultados */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
            <h3 className="font-medium text-lg">Markup Delivery Calculado</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Soma dos Percentuais (%)</Label>
                  <div className="bg-white p-3 rounded-md border text-xl font-semibold flex justify-center items-center h-12">
                    {formData.total_percentuais.toFixed(2)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Markup Divisor do Delivery</Label>
                  <div className="bg-white p-3 rounded-md border text-xl font-semibold flex justify-center items-center h-12">
                    {formData.markup_delivery.toFixed(2)}
                  </div>
                  <div className="flex justify-center">
                    <Badge className={getMarkupScenario(formData.markup_delivery).color}>
                      {getMarkupScenario(formData.markup_delivery).text}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveMarkup} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Markup Delivery
                  </Button>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Seção 5: Exemplo Prático */}
          <div className="bg-gray-50 p-4 rounded-md space-y-4 border">
            <h3 className="font-medium">Exemplo de aplicação</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Custo exemplo"
                  value={produtoExemplo.custoPorPorcao}
                  onChange={(e) => setProdutoExemplo({
                    custoPorPorcao: parseFloat(e.target.value) || 0
                  })}
                  className="w-40"
                />
                <Label>Custo por porção</Label>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-md border">
                <div className="font-medium">Preço Delivery:</div>
                <div>{formatCurrency(produtoExemplo.custoPorPorcao * formData.markup_delivery)}</div>
                
                <div className="font-medium">Margem sobre preço:</div>
                <div>{formatarPercentual(formData.margem_lucro_desejada / 100)}</div>
                
                <div className="font-medium">Lucro por item:</div>
                <div>{formatCurrency(produtoExemplo.custoPorPorcao * formData.markup_delivery * (formData.margem_lucro_desejada / 100))}</div>
                
                <div className="font-medium">Total taxas e custos:</div>
                <div>{formatarPercentual((formData.total_percentuais - formData.margem_lucro_desejada) / 100)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
