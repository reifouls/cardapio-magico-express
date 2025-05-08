
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

type Produto = Tables<'produtos'> & {
  categoria?: { nome: string };
  ficha_tecnica?: {
    ingrediente: { 
      nome: string;
      unidade: string;
      custo_unitario: number;
    };
    quantidade_utilizada: number;
  }[];
};

export default function FichasTecnicas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduto, setCurrentProduto] = useState<Partial<Produto> | null>(null);
  const [ingredientes, setIngredientes] = useState<{id: string, quantidade: number}[]>([]);

  const { data: produtos, isLoading } = useSupabaseQuery<Produto[]>(
    'produtos',
    ['list'],
    { 
      select: '*, categoria:categoria_id(nome)',
      order: 'nome'
    }
  );

  const { data: categoriasList } = useSupabaseQuery<Tables<'categorias'>[]>(
    'categorias',
    ['list'],
    { order: 'nome' }
  );

  const { data: ingredientesList } = useSupabaseQuery<Tables<'ingredientes'>[]>(
    'ingredientes',
    ['list'],
    { order: 'nome' }
  );

  const { insert: insertProduto, update: updateProduto } = useSupabaseMutation<Tables<'produtos'>>(
    'produtos',
    {
      onSuccessMessage: 'Produto salvo com sucesso!',
      onErrorMessage: 'Erro ao salvar produto',
      queryKeyToInvalidate: ['produtos', 'list']
    }
  );

  const { insert: insertFichaTecnica } = useSupabaseMutation<Tables<'ficha_tecnica'>>(
    'ficha_tecnica',
    {
      onSuccessMessage: 'Ficha técnica salva com sucesso!',
      queryKeyToInvalidate: ['produtos', 'list']
    }
  );

  const handleNewClick = () => {
    setCurrentProduto({
      nome: '',
      rendimento: 1,
      tipo: 'Produto',
    });
    setIngredientes([]);
    setIsFormOpen(true);
  };

  const handleEditClick = (produto: Produto) => {
    setCurrentProduto(produto);
    // Fetch ficha técnica for this product
    setIsFormOpen(true);
  };

  const handleAddIngrediente = () => {
    if (ingredientesList?.length) {
      setIngredientes([...ingredientes, { id: ingredientesList[0].id, quantidade: 0 }]);
    }
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentProduto?.nome || !currentProduto.rendimento) return;
    
    try {
      let produtoId = currentProduto.id;
      
      if (!produtoId) {
        // Insert new produto
        const produtoData = {
          nome: currentProduto.nome,
          categoria_id: currentProduto.categoria_id,
          rendimento: currentProduto.rendimento,
          tipo: currentProduto.tipo,
          preco_definido: currentProduto.preco_definido
        };
        
        const newProduto = await insertProduto(produtoData);
        produtoId = newProduto[0]?.id;
      } else {
        // Update existing produto
        await updateProduto({
          id: produtoId,
          data: {
            nome: currentProduto.nome,
            categoria_id: currentProduto.categoria_id,
            rendimento: currentProduto.rendimento,
            tipo: currentProduto.tipo,
            preco_definido: currentProduto.preco_definido
          }
        });
      }

      // Insert or update ficha_tecnica entries
      if (produtoId) {
        for (const ingrediente of ingredientes) {
          if (ingrediente.quantidade > 0) {
            await insertFichaTecnica({
              produto_id: produtoId,
              ingrediente_id: ingrediente.id,
              quantidade_utilizada: ingrediente.quantidade
            });
          }
        }
      }

      setIsFormOpen(false);
      setCurrentProduto(null);
      setIngredientes([]);

    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome"
    },
    {
      header: "Categoria",
      accessorKey: (row: Produto) => row.categoria?.nome || "-"
    },
    {
      header: "Rendimento",
      accessorKey: "rendimento",
      cell: (row: Produto) => `${row.rendimento} porções`
    },
    {
      header: "Custo Total",
      accessorKey: "custo_total_receita",
      cell: (row: Produto) => formatCurrency(row.custo_total_receita || 0)
    },
    {
      header: "Custo por Porção",
      accessorKey: "custo_por_porcao",
      cell: (row: Produto) => formatCurrency(row.custo_por_porcao || 0)
    },
    {
      header: "Preço",
      accessorKey: "preco_definido",
      cell: (row: Produto) => formatCurrency(row.preco_definido || 0)
    },
    {
      header: "Margem",
      accessorKey: "margem",
      cell: (row: Produto) => formatarPercentual(row.margem || 0)
    }
  ];

  return (
    <>
      <PageHeader 
        title="Fichas Técnicas" 
        description="Gerencie as fichas técnicas de seus produtos"
        onNewItem={handleNewClick}
        newItemLabel="Nova Ficha Técnica"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={produtos || []}
            columns={columns}
            onEdit={handleEditClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>
              {currentProduto?.id ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  value={currentProduto?.nome || ''}
                  onChange={(e) => setCurrentProduto({...currentProduto!, nome: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={currentProduto?.categoria_id || ''} 
                  onValueChange={(value) => setCurrentProduto({...currentProduto!, categoria_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasList?.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rendimento">Rendimento (porções)</Label>
                <Input
                  id="rendimento"
                  type="number"
                  min="1"
                  value={currentProduto?.rendimento || 1}
                  onChange={(e) => setCurrentProduto(
                    {...currentProduto!, rendimento: parseInt(e.target.value) || 1}
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preco">Preço de Venda (opcional)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={currentProduto?.preco_definido || ''}
                  onChange={(e) => setCurrentProduto(
                    {...currentProduto!, preco_definido: parseFloat(e.target.value) || undefined}
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ingredientes</h3>
                <Button type="button" onClick={handleAddIngrediente} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Ingrediente
                </Button>
              </div>

              {ingredientes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum ingrediente adicionado.</p>
              )}

              {ingredientes.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select 
                      value={item.id} 
                      onValueChange={(value) => {
                        const newIngredientes = [...ingredientes];
                        newIngredientes[index].id = value;
                        setIngredientes(newIngredientes);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredientesList?.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.nome} ({ing.unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) => {
                        const newIngredientes = [...ingredientes];
                        newIngredientes[index].quantidade = parseFloat(e.target.value) || 0;
                        setIngredientes(newIngredientes);
                      }}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveIngrediente(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Salvar Ficha Técnica
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
