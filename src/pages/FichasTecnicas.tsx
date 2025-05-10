
import React, { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Database } from '@/integrations/supabase/types';
import FichaTecnicaForm from '@/components/fichas-tecnicas/FichaTecnicaForm';

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

  const { data: fichaTecnica, refetch: refetchFichaTecnica } = useSupabaseQuery<
    'ficha_tecnica',
    false,
    (FichaTecnica & {ingrediente: Ingrediente})[]
  >(
    'ficha_tecnica',
    ['by-produto', currentProduto?.id || ''],
    { 
      select: '*, ingrediente:ingrediente_id(*)',
      filter: { column: 'produto_id', value: currentProduto?.id || '' },
      enabled: !!currentProduto?.id
    }
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
  React.useEffect(() => {
    if (fichaTecnica && fichaTecnica.length > 0 && currentProduto?.id) {
      // Map ficha_tecnica to ingredientes state format
      setIngredientes(
        fichaTecnica.map(item => ({
          id: item.ingrediente_id,
          quantidade: item.quantidade_utilizada
        }))
      );
    }
  }, [fichaTecnica, currentProduto]);

  const handleNewClick = () => {
    setCurrentProduto({
      nome: '',
      rendimento: 1,
      tipo: 'Produto',
    });
    setIngredientes([]);
    setIsFormOpen(true);
  };

  const handleEditClick = (produto: ProdutoWithExtras) => {
    setCurrentProduto(produto);
    setIngredientes([]);
    refetchFichaTecnica();
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!currentProduto?.nome || !currentProduto.rendimento) return;
    
    try {
      let produtoId = currentProduto.id;
      
      // Complete the save function
      if (!produtoId) {
        // Insert new produto
        const produtoToInsert = {
          nome: currentProduto.nome,
          rendimento: currentProduto.rendimento,
          tipo: currentProduto.tipo || 'Produto',
          categoria_id: currentProduto.categoria_id,
          custo_total_receita: currentProduto.custo_total_receita,
          custo_por_porcao: currentProduto.custo_por_porcao,
          preco_definido: currentProduto.preco_definido,
          preco_sugerido: currentProduto.preco_sugerido,
          margem: currentProduto.margem
        };
        
        const newProduto = await insertProduto(produtoToInsert);
        produtoId = newProduto?.[0]?.id;
      } else {
        // Update existing produto
        await updateProduto({
          id: produtoId,
          data: currentProduto
        });
        
        // Remove existing ficha_tecnica entries
        // Here's the fix: we need to pass a string filter instead of an object
        await removeFichaTecnica(`produto_id.eq.${produtoId}`);
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
          
          <FichaTecnicaForm 
            currentProduto={currentProduto}
            setCurrentProduto={setCurrentProduto}
            ingredientes={ingredientes}
            setIngredientes={setIngredientes}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
