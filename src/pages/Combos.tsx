
import React, { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tables } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Save } from 'lucide-react';

type Combo = Tables<'combos'> & {
  produtos?: {
    produto: {
      id: string;
      nome: string;
      custo_por_porcao: number;
      preco_definido: number;
    };
    quantidade: number;
  }[];
};

export default function Combos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCombo, setCurrentCombo] = useState<Partial<Combo> | null>(null);
  const [produtosCombo, setProdutosCombo] = useState<{id: string, quantidade: number}[]>([]);

  const { data: combos, isLoading } = useSupabaseQuery<Combo[]>(
    'combos',
    ['list'],
    { order: 'nome' }
  );

  const { data: produtosList } = useSupabaseQuery<Tables<'produtos'>[]>(
    'produtos',
    ['list'],
    { 
      select: 'id, nome, preco_definido, custo_por_porcao',
      order: 'nome',
      filter: { tipo: 'Produto' }
    }
  );

  const { insert: insertCombo, update: updateCombo, remove: deleteCombo } = 
    useSupabaseMutation<Tables<'combos'>>(
      'combos',
      {
        onSuccessMessage: 'Combo salvo com sucesso!',
        onErrorMessage: 'Erro ao salvar combo',
        queryKeyToInvalidate: ['combos', 'list']
      }
    );

  const { insert: insertComboProduto } = useSupabaseMutation<Tables<'combo_produtos'>>(
    'combo_produtos',
    {
      queryKeyToInvalidate: ['combos', 'list']
    }
  );

  const handleNewClick = () => {
    setCurrentCombo({
      nome: '',
      preco_total: 0,
      custo_total: 0,
      margem_combo: 0
    });
    setProdutosCombo([]);
    setIsFormOpen(true);
  };

  const handleEditClick = (combo: Combo) => {
    setCurrentCombo(combo);
    // TODO: Fetch combo products
    setProdutosCombo([]);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (combo: Combo) => {
    if (window.confirm(`Deseja realmente excluir o combo "${combo.nome}"?`)) {
      await deleteCombo(combo.id);
    }
  };

  const handleAddProduto = () => {
    if (produtosList?.length) {
      setProdutosCombo([...produtosCombo, { id: produtosList[0].id, quantidade: 1 }]);
    }
  };

  const handleRemoveProduto = (index: number) => {
    setProdutosCombo(produtosCombo.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let custoTotal = 0;
    let precoTotal = 0;
    
    produtosCombo.forEach(item => {
      const produto = produtosList?.find(p => p.id === item.id);
      if (produto) {
        custoTotal += (produto.custo_por_porcao || 0) * item.quantidade;
        precoTotal += (produto.preco_definido || 0) * item.quantidade;
      }
    });
    
    let margem = 0;
    if (precoTotal > 0) {
      margem = (precoTotal - custoTotal) / precoTotal;
    }
    
    // If user manually set a preco_total, use that for margin calculation
    if (currentCombo?.preco_total && currentCombo.preco_total > 0) {
      margem = (currentCombo.preco_total - custoTotal) / currentCombo.preco_total;
    } else {
      // Otherwise use calculated price
      setCurrentCombo({
        ...currentCombo!,
        preco_total: precoTotal
      });
    }
    
    setCurrentCombo({
      ...currentCombo!,
      custo_total: custoTotal,
      margem_combo: margem
    });
    
    return { custoTotal, precoTotal, margem };
  };

  React.useEffect(() => {
    if (produtosCombo.length > 0 && produtosList?.length) {
      calculateTotals();
    }
  }, [produtosCombo]);

  const handleSave = async () => {
    if (!currentCombo?.nome || !currentCombo.preco_total) return;
    
    try {
      const { custoTotal, margem } = calculateTotals();
      let comboId = currentCombo.id;
      
      if (comboId) {
        // Update existing combo
        await updateCombo({
          id: comboId,
          data: {
            nome: currentCombo.nome,
            preco_total: currentCombo.preco_total,
            custo_total: custoTotal,
            margem_combo: margem
          }
        });
      } else {
        // Insert new combo
        const newCombo = await insertCombo({
          nome: currentCombo.nome,
          preco_total: currentCombo.preco_total,
          custo_total: custoTotal,
          margem_combo: margem
        });
        comboId = newCombo[0]?.id;
      }

      // Insert combo_produtos entries
      if (comboId) {
        for (const produto of produtosCombo) {
          await insertComboProduto({
            combo_id: comboId,
            produto_id: produto.id,
            quantidade: produto.quantidade
          });
        }
      }

      setIsFormOpen(false);
      setCurrentCombo(null);
      setProdutosCombo([]);

    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const
    },
    {
      header: "Custo Total",
      accessorKey: "custo_total" as const,
      cell: (row: Combo) => formatCurrency(row.custo_total || 0)
    },
    {
      header: "Preço Total",
      accessorKey: "preco_total" as const,
      cell: (row: Combo) => formatCurrency(row.preco_total)
    },
    {
      header: "Margem",
      accessorKey: "margem_combo" as const,
      cell: (row: Combo) => formatarPercentual(row.margem_combo || 0)
    }
  ];

  return (
    <>
      <PageHeader 
        title="Combos" 
        description="Gerencie os combos e promoções"
        onNewItem={handleNewClick}
        newItemLabel="Novo Combo"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Combos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={combos || []}
            columns={columns}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>
              {currentCombo?.id ? 'Editar Combo' : 'Novo Combo'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Combo</Label>
              <Input
                id="nome"
                value={currentCombo?.nome || ''}
                onChange={(e) => setCurrentCombo({...currentCombo!, nome: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Produtos do Combo</h3>
                <Button type="button" onClick={handleAddProduto} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Produto
                </Button>
              </div>

              {produtosCombo.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum produto adicionado.</p>
              )}

              {produtosCombo.map((item, index) => {
                const produto = produtosList?.find(p => p.id === item.id);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select 
                        value={item.id} 
                        onValueChange={(value) => {
                          const newProdutos = [...produtosCombo];
                          newProdutos[index].id = value;
                          setProdutosCombo(newProdutos);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {produtosList?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome} ({formatCurrency(p.preco_definido || 0)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const newProdutos = [...produtosCombo];
                          newProdutos[index].quantidade = parseInt(e.target.value) || 1;
                          setProdutosCombo(newProdutos);
                        }}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveProduto(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium mb-1">Custo Total:</p>
                <p className="text-lg font-bold">{formatCurrency(currentCombo?.custo_total || 0)}</p>
              </div>
              
              <div>
                <div className="space-y-1">
                  <Label htmlFor="preco_total">Preço de Venda:</Label>
                  <Input
                    id="preco_total"
                    type="number"
                    step="0.01"
                    value={currentCombo?.preco_total || ''}
                    onChange={(e) => {
                      const preco = parseFloat(e.target.value) || 0;
                      setCurrentCombo({...currentCombo!, preco_total: preco});
                      
                      // Recalculate margin
                      const custoTotal = currentCombo?.custo_total || 0;
                      const margem = preco > 0 ? (preco - custoTotal) / preco : 0;
                      setCurrentCombo({
                        ...currentCombo!,
                        preco_total: preco,
                        margem_combo: margem
                      });
                    }}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Margem:</p>
                <p className="text-lg font-bold">{formatarPercentual(currentCombo?.margem_combo || 0)}</p>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Salvar Combo
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
