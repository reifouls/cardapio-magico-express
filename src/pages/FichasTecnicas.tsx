
import React, { useState, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Save } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

// Define proper types for our data
type Produto = Database['public']['Tables']['produtos']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Ingrediente = Database['public']['Tables']['ingredientes']['Row'];
type FichaTecnica = Database['public']['Tables']['ficha_tecnica']['Row'];

// Extended product with category and ingredients
interface ProdutoWithExtras extends Produto {
  categoria?: Categoria;
  ficha_tecnica?: (FichaTecnica & {
    ingrediente: Ingrediente;
  })[];
}

export default function FichasTecnicas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduto, setCurrentProduto] = useState<Partial<Produto> | null>(null);
  const [ingredientes, setIngredientes] = useState<{id: string, quantidade: number}[]>([]);
  const [custoTotal, setCustoTotal] = useState(0);
  const [custoPorPorcao, setCustoPorPorcao] = useState(0);
  const [precoSugerido, setPrecoSugerido] = useState(0);

  const { data: produtos, isLoading } = useSupabaseQuery<
    'produtos',
    false,
    ProdutoWithExtras[]
  >(
    'produtos',
    ['list'],
    { 
      select: '*, categoria:categoria_id(*)',
      order: 'nome'
    }
  );

  const { data: categoriasList } = useSupabaseQuery<
    'categorias',
    false,
    Categoria[]
  >(
    'categorias',
    ['list'],
    { order: 'nome' }
  );

  const { data: ingredientesList } = useSupabaseQuery<
    'ingredientes',
    false,
    Ingrediente[]
  >(
    'ingredientes',
    ['list'],
    { order: 'nome' }
  );

  const { data: markup } = useSupabaseQuery(
    'premissas_markup',
    ['markup'],
    { single: true }
  );

  const { data: fichaTecnica, refetch: refetchFichaTecnica } = useSupabaseQuery<
    'ficha_tecnica',
    false,
    (FichaTecnica & {ingrediente: Ingrediente})[]
  >(
    'ficha_tecnica',
    ['by-produto', currentProduto?.id || ''],
    { 
      select: '*, ingrediente:ingrediente_id(*)',
      filter: { column: 'produto_id', operator: 'eq', value: currentProduto?.id || '' }
    },
    { enabled: !!currentProduto?.id }
  );

  const { insert: insertProduto, update: updateProduto } = useSupabaseMutation<'produtos'>(
    'produtos',
    {
      onSuccessMessage: 'Produto salvo com sucesso!',
      onErrorMessage: 'Erro ao salvar produto',
      queryKeyToInvalidate: ['produtos', 'list']
    }
  );

  const { insert: insertFichaTecnica, remove: removeFichaTecnica } = useSupabaseMutation<'ficha_tecnica'>(
    'ficha_tecnica',
    {
      onSuccessMessage: 'Ficha técnica salva com sucesso!',
      queryKeyToInvalidate: ['produtos', 'list', 'ficha_tecnica']
    }
  );

  // Load ficha_tecnica when editing
  useEffect(() => {
    if (fichaTecnica && fichaTecnica.length > 0 && currentProduto?.id) {
      // Map ficha_tecnica to ingredientes state format
      setIngredientes(
        fichaTecnica.map(item => ({
          id: item.ingrediente_id,
          quantidade: item.quantidade_utilizada
        }))
      );

      // Calculate costs
      calculateCustos(fichaTecnica, currentProduto.rendimento || 1);
    }
  }, [fichaTecnica, currentProduto]);

  const calculateCustos = (fichaItems: (FichaTecnica & {ingrediente: Ingrediente})[], rendimento: number) => {
    // Calculate total cost
    const total = fichaItems.reduce((sum, item) => {
      return sum + (item.quantidade_utilizada * item.ingrediente.custo_unitario);
    }, 0);
    
    setCustoTotal(total);
    
    // Calculate cost per portion
    const porPorcao = total / rendimento;
    setCustoPorPorcao(porPorcao);
    
    // Calculate suggested price based on markup
    if (markup && markup.markup_ponderado) {
      const sugerido = porPorcao * markup.markup_ponderado;
      setPrecoSugerido(sugerido);
    }
  };

  // Calculate costs when ingredients or rendimiento change
  useEffect(() => {
    if (ingredientesList && ingredientes.length > 0) {
      const fichaItems = ingredientes.map(item => {
        const ing = ingredientesList.find(i => i.id === item.id);
        return {
          ingrediente_id: item.id,
          produto_id: currentProduto?.id || '',
          quantidade_utilizada: item.quantidade,
          ingrediente: ing!
        };
      }).filter(item => item.ingrediente); // Filter out any undefined ingredientes
      
      calculateCustos(fichaItems, currentProduto?.rendimento || 1);
    }
  }, [ingredientes, ingredientesList, currentProduto?.rendimento]);

  const handleNewClick = () => {
    setCurrentProduto({
      nome: '',
      rendimento: 1,
      tipo: 'Produto',
    });
    setIngredientes([]);
    setCustoTotal(0);
    setCustoPorPorcao(0);
    setPrecoSugerido(0);
    setIsFormOpen(true);
  };

  const handleEditClick = (produto: ProdutoWithExtras) => {
    setCurrentProduto(produto);
    refetchFichaTecnica();
    setIsFormOpen(true);
  };

  const handleAddIngrediente = () => {
    if (ingredientesList && ingredientesList.length > 0) {
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
      
      // Prepare values for custo_total e custo_por_porcao
      const produtoData = {
        nome: currentProduto.nome,
        categoria_id: currentProduto.categoria_id,
        rendimento: currentProduto.rendimento,
        tipo: currentProduto.tipo,
        preco_definido: currentProduto.preco_definido,
        custo_total_receita: custoTotal,
        custo_por_porcao: custoPorPorcao,
        preco_sugerido: precoSugerido,
        margem: currentProduto.preco_definido 
          ? (currentProduto.preco_definido - custoPorPorcao) / currentProduto.preco_definido 
          : (precoSugerido - custoPorPorcao) / precoSugerido
      };
      
      if (!produtoId) {
        // Insert new produto
        const newProduto = await insertProduto(produtoData);
        produtoId = newProduto?.[0]?.id;
      } else {
        // Update existing produto
        await updateProduto({
          id: produtoId,
          data: produtoData
        });
        
        // Remove existing ficha_tecnica entries to recreate them
        await removeFichaTecnica({ column: 'produto_id', value: produtoId });
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
      accessorKey: "categoria.nome",
      cell: (info: { row: { original: ProdutoWithExtras } }) => 
        info.row.original.categoria?.nome || "-"
    },
    {
      header: "Rendimento",
      accessorKey: "rendimento",
      cell: (info: { row: { original: ProdutoWithExtras } }) => 
        `${info.row.original.rendimento} porções`
    },
    {
      header: "Custo Total",
      accessorKey: "custo_total_receita",
      cell: (info: { row: { original: ProdutoWithExtras } }) => 
        formatCurrency(info.row.original.custo_total_receita || 0)
    },
    {
      header: "Custo por Porção",
      accessorKey: "custo_por_porcao",
      cell: (info: { row: { original: ProdutoWithExtras } }) => 
        formatCurrency(info.row.original.custo_por_porcao || 0)
    },
    {
      header: "Preço",
      accessorKey: "preco_definido",
      cell: (info: { row: { original: ProdutoWithExtras } }) => 
        formatCurrency(info.row.original.preco_definido || info.row.original.preco_sugerido || 0)
    },
    {
      header: "Margem",
      accessorKey: "margem",
      cell: (info: { row: { original: ProdutoWithExtras } }) => 
        formatarPercentual(info.row.original.margem || 0)
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
                {precoSugerido > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Preço sugerido: {formatCurrency(precoSugerido)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Custo Total da Receita</Label>
                <Input
                  type="text"
                  value={formatCurrency(custoTotal)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Custo por Porção</Label>
                <Input
                  type="text"
                  value={formatCurrency(custoPorPorcao)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Margem Estimada</Label>
                <Input
                  type="text"
                  value={formatarPercentual(
                    currentProduto?.preco_definido 
                      ? (currentProduto.preco_definido - custoPorPorcao) / currentProduto.preco_definido 
                      : (precoSugerido - custoPorPorcao) / precoSugerido
                  )}
                  readOnly
                  className="bg-gray-50"
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
