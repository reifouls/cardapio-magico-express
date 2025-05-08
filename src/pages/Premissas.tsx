
import React, { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Settings } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type CapacidadeProdutiva = Database['public']['Tables']['premissas_capacidade_produtiva']['Row'];
type DespesaFixa = Database['public']['Tables']['premissas_despesas_fixas']['Row'];
type Markup = Database['public']['Tables']['premissas_markup']['Row'];
type RegraArredondamento = Database['public']['Tables']['regras_arredondamento']['Row'];

export default function Premissas() {
  const [activeTab, setActiveTab] = useState('capacidade');

  // ===================== CAPACIDADE PRODUTIVA =====================
  const { data: capacidadeProdutiva, isLoading: isLoadingCapacidade } = useSupabaseQuery<'premissas_capacidade_produtiva', CapacidadeProdutiva>(
    'premissas_capacidade_produtiva',
    ['capacidade'],
    { single: true }
  );

  const [capacidadeForm, setCapacidadeForm] = useState<Partial<CapacidadeProdutiva>>({
    funcionarios: 0,
    horas_dia: 8,
    dias_mes: 22,
    produtividade: 0.75
  });

  React.useEffect(() => {
    if (capacidadeProdutiva) {
      setCapacidadeForm(capacidadeProdutiva);
    }
  }, [capacidadeProdutiva]);

  const { update: updateCapacidade, insert: insertCapacidade } = useSupabaseMutation<'premissas_capacidade_produtiva'>(
    'premissas_capacidade_produtiva',
    {
      onSuccessMessage: 'Capacidade produtiva salva com sucesso!',
      queryKeyToInvalidate: ['capacidade']
    }
  );

  const handleSaveCapacidade = async () => {
    if (capacidadeProdutiva?.id) {
      await updateCapacidade({
        id: capacidadeProdutiva.id,
        data: {
          funcionarios: capacidadeForm.funcionarios || 0,
          horas_dia: capacidadeForm.horas_dia || 0,
          dias_mes: capacidadeForm.dias_mes || 0,
          produtividade: capacidadeForm.produtividade || 0
        }
      });
    } else {
      await insertCapacidade({
        funcionarios: capacidadeForm.funcionarios || 0,
        horas_dia: capacidadeForm.horas_dia || 0,
        dias_mes: capacidadeForm.dias_mes || 0,
        produtividade: capacidadeForm.produtividade || 0
      });
    }
  };

  // ===================== DESPESAS FIXAS =====================
  const { data: despesasFixas, isLoading: isLoadingDespesas } = useSupabaseQuery<'premissas_despesas_fixas', DespesaFixa[]>(
    'premissas_despesas_fixas',
    ['despesas'],
    { order: 'nome_despesa' }
  );

  const [novaDespesa, setNovaDespesa] = useState<Partial<DespesaFixa>>({
    nome_despesa: '',
    tipo: 'Aluguel',
    valor: 0
  });

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
      tipo: novaDespesa.tipo || 'Aluguel',
      valor: novaDespesa.valor
    });
    setNovaDespesa({ nome_despesa: '', tipo: 'Aluguel', valor: 0 });
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

  // ===================== MARKUP =====================
  const { data: markup, isLoading: isLoadingMarkup } = useSupabaseQuery<'premissas_markup', Markup>(
    'premissas_markup',
    ['markup'],
    { single: true }
  );

  const [markupForm, setMarkupForm] = useState<Partial<Markup>>({
    percentual_custos_fixos: 0.3,
    percentual_impostos: 0.09,
    percentual_delivery: 0.15,
    markup_loja: 2.5,
    markup_delivery: 3.0,
    markup_ponderado: 2.65
  });

  React.useEffect(() => {
    if (markup) {
      setMarkupForm(markup);
    }
  }, [markup]);

  const { update: updateMarkup, insert: insertMarkup } = useSupabaseMutation<'premissas_markup'>(
    'premissas_markup',
    {
      onSuccessMessage: 'Markup salvo com sucesso!',
      queryKeyToInvalidate: ['markup']
    }
  );

  const handleSaveMarkup = async () => {
    if (markup?.id) {
      await updateMarkup({
        id: markup.id,
        data: {
          percentual_custos_fixos: markupForm.percentual_custos_fixos || 0,
          percentual_impostos: markupForm.percentual_impostos || 0,
          percentual_delivery: markupForm.percentual_delivery || 0,
          markup_loja: markupForm.markup_loja || 0,
          markup_delivery: markupForm.markup_delivery || 0,
          markup_ponderado: markupForm.markup_ponderado || 0
        }
      });
    } else {
      await insertMarkup({
        percentual_custos_fixos: markupForm.percentual_custos_fixos || 0,
        percentual_impostos: markupForm.percentual_impostos || 0,
        percentual_delivery: markupForm.percentual_delivery || 0,
        markup_loja: markupForm.markup_loja || 0,
        markup_delivery: markupForm.markup_delivery || 0,
        markup_ponderado: markupForm.markup_ponderado || 0
      });
    }
  };

  // ===================== REGRAS DE ARREDONDAMENTO =====================
  const { data: regrasArredondamento, isLoading: isLoadingRegras } = useSupabaseQuery<'regras_arredondamento', RegraArredondamento[]>(
    'regras_arredondamento',
    ['regras'],
    { order: 'nome' }
  );

  const [novaRegra, setNovaRegra] = useState<Partial<RegraArredondamento>>({
    nome: '',
    descricao: '',
    logica: ''
  });

  const { insert: insertRegra, remove: deleteRegra } = useSupabaseMutation<'regras_arredondamento'>(
    'regras_arredondamento',
    {
      onSuccessMessage: 'Regra salva com sucesso!',
      queryKeyToInvalidate: ['regras']
    }
  );

  const handleAddRegra = async () => {
    if (!novaRegra.nome || !novaRegra.logica) return;
    await insertRegra({
      nome: novaRegra.nome,
      descricao: novaRegra.descricao || '',
      logica: novaRegra.logica
    });
    setNovaRegra({ nome: '', descricao: '', logica: '' });
  };

  const handleDeleteRegra = async (regra: RegraArredondamento) => {
    if (window.confirm(`Deseja realmente excluir a regra "${regra.nome}"?`)) {
      await deleteRegra(regra.id);
    }
  };

  const regrasColumns = [
    {
      header: "Nome",
      accessorKey: "nome"
    },
    {
      header: "Descrição",
      accessorKey: "descricao"
    },
    {
      header: "Lógica",
      accessorKey: "logica"
    }
  ];

  const calculatedTotalDespesas = React.useMemo(() => {
    return despesasFixas?.reduce((sum, despesa) => sum + (despesa.valor || 0), 0) || 0;
  }, [despesasFixas]);

  return (
    <>
      <PageHeader 
        title="Premissas" 
        description="Configure as premissas para cálculos do sistema"
      />
      
      <Tabs 
        defaultValue="capacidade" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacidade">Capacidade Produtiva</TabsTrigger>
          <TabsTrigger value="despesas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="markup">Markup</TabsTrigger>
          <TabsTrigger value="regras">Regras de Arredondamento</TabsTrigger>
        </TabsList>
        
        {/* Tab de Capacidade Produtiva */}
        <TabsContent value="capacidade">
          <Card>
            <CardContent className="pt-6">
              {isLoadingCapacidade ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="funcionarios">Número de Funcionários</Label>
                    <Input
                      id="funcionarios"
                      type="number"
                      min="1"
                      value={capacidadeForm.funcionarios || ''}
                      onChange={(e) => setCapacidadeForm({
                        ...capacidadeForm,
                        funcionarios: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="horas_dia">Horas por Dia</Label>
                    <Input
                      id="horas_dia"
                      type="number"
                      min="1"
                      max="24"
                      value={capacidadeForm.horas_dia || ''}
                      onChange={(e) => setCapacidadeForm({
                        ...capacidadeForm,
                        horas_dia: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dias_mes">Dias por Mês</Label>
                    <Input
                      id="dias_mes"
                      type="number"
                      min="1"
                      max="31"
                      value={capacidadeForm.dias_mes || ''}
                      onChange={(e) => setCapacidadeForm({
                        ...capacidadeForm,
                        dias_mes: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="produtividade">Produtividade (%)</Label>
                    <Input
                      id="produtividade"
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={capacidadeForm.produtividade || ''}
                      onChange={(e) => setCapacidadeForm({
                        ...capacidadeForm,
                        produtividade: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor entre 0 e 1 (ex: 0.75 = 75%)
                    </p>
                  </div>
                  
                  <div className="col-span-2 pt-4">
                    <Button onClick={handleSaveCapacidade} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Capacidade Produtiva
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Despesas Fixas */}
        <TabsContent value="despesas">
          <Card>
            <CardContent className="pt-6">
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
                    <Input
                      id="tipo_despesa"
                      value={novaDespesa.tipo || ''}
                      onChange={(e) => setNovaDespesa({
                        ...novaDespesa,
                        tipo: e.target.value
                      })}
                    />
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
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Markup */}
        <TabsContent value="markup">
          <Card>
            <CardContent className="pt-6">
              {isLoadingMarkup ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="percentual_custos_fixos">% Custos Fixos</Label>
                    <Input
                      id="percentual_custos_fixos"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={markupForm.percentual_custos_fixos || ''}
                      onChange={(e) => setMarkupForm({
                        ...markupForm,
                        percentual_custos_fixos: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatarPercentual(markupForm.percentual_custos_fixos || 0)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="percentual_impostos">% Impostos</Label>
                    <Input
                      id="percentual_impostos"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={markupForm.percentual_impostos || ''}
                      onChange={(e) => setMarkupForm({
                        ...markupForm,
                        percentual_impostos: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatarPercentual(markupForm.percentual_impostos || 0)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="percentual_delivery">% Vendas Delivery</Label>
                    <Input
                      id="percentual_delivery"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={markupForm.percentual_delivery || ''}
                      onChange={(e) => setMarkupForm({
                        ...markupForm,
                        percentual_delivery: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatarPercentual(markupForm.percentual_delivery || 0)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="markup_loja">Markup Loja</Label>
                    <Input
                      id="markup_loja"
                      type="number"
                      min="1"
                      step="0.1"
                      value={markupForm.markup_loja || ''}
                      onChange={(e) => setMarkupForm({
                        ...markupForm,
                        markup_loja: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="markup_delivery">Markup Delivery</Label>
                    <Input
                      id="markup_delivery"
                      type="number"
                      min="1"
                      step="0.1"
                      value={markupForm.markup_delivery || ''}
                      onChange={(e) => setMarkupForm({
                        ...markupForm,
                        markup_delivery: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="markup_ponderado">Markup Ponderado</Label>
                    <Input
                      id="markup_ponderado"
                      type="number"
                      min="1"
                      step="0.1"
                      value={markupForm.markup_ponderado || ''}
                      onChange={(e) => setMarkupForm({
                        ...markupForm,
                        markup_ponderado: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="col-span-2 pt-4">
                    <Button onClick={handleSaveMarkup} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Markup
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Regras de Arredondamento */}
        <TabsContent value="regras">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_regra">Nome da Regra</Label>
                    <Input
                      id="nome_regra"
                      value={novaRegra.nome || ''}
                      onChange={(e) => setNovaRegra({
                        ...novaRegra,
                        nome: e.target.value
                      })}
                      placeholder="ex: Centavos 90"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao_regra">Descrição</Label>
                    <Input
                      id="descricao_regra"
                      value={novaRegra.descricao || ''}
                      onChange={(e) => setNovaRegra({
                        ...novaRegra,
                        descricao: e.target.value
                      })}
                      placeholder="ex: Arredondar para X,90"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logica_regra">Lógica</Label>
                    <Input
                      id="logica_regra"
                      value={novaRegra.logica || ''}
                      onChange={(e) => setNovaRegra({
                        ...novaRegra,
                        logica: e.target.value
                      })}
                      placeholder="ex: Math.floor(x) + 0.90"
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <Button onClick={handleAddRegra} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Regra de Arredondamento
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <DataTable 
                    data={regrasArredondamento || []}
                    columns={regrasColumns}
                    onDelete={handleDeleteRegra}
                    isLoading={isLoadingRegras}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
