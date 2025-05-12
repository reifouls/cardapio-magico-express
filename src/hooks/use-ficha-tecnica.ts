
import { useState, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Database } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/sonner';

// Define proper types for our data
type Produto = Database['public']['Tables']['produtos']['Row'];
type FichaTecnica = Database['public']['Tables']['ficha_tecnica']['Row'];
type Ingrediente = Database['public']['Tables']['ingredientes']['Row'];

// Extended product with ficha tecnica
export interface ProdutoWithFichaTecnica extends Produto {
  categoria?: {
    id: string;
    nome: string;
  };
  ficha_tecnica?: (FichaTecnica & {
    ingrediente: Ingrediente;
  })[];
}

interface UseFichaTecnicaOptions {
  onSuccessMessage?: string;
  onErrorMessage?: string;
}

export function useFichaTecnica(options?: UseFichaTecnicaOptions) {
  const [currentProduto, setCurrentProduto] = useState<Partial<Produto> | null>(null);
  const [ingredientes, setIngredientes] = useState<{id: string, quantidade: number}[]>([]);
  const queryClient = useQueryClient();

  // Query for all produtos
  const { data: produtos, isLoading, refetch: refetchProdutos } = useSupabaseQuery<
    'produtos',
    false,
    ProdutoWithFichaTecnica[]
  >(
    'produtos',
    ['list'],
    { 
      select: '*, categoria:categoria_id(*)',
      order: 'nome'
    }
  );

  // Query for specific ficha tecnica
  const { data: fichaTecnica, refetch: refetchFichaTecnica } = useSupabaseQuery<
    'ficha_tecnica',
    false,
    (FichaTecnica & {ingrediente: Ingrediente})[]
  >(
    'ficha_tecnica',
    ['by-produto', currentProduto?.id || ''],
    { 
      select: '*, ingrediente:ingrediente_id(*)',
      filter: { produto_id: currentProduto?.id },
      enabled: !!currentProduto?.id
    }
  );

  // Mutations for produto and ficha_tecnica tables
  const { 
    insert: insertProduto, 
    update: updateProduto 
  } = useSupabaseMutation<'produtos'>(
    'produtos',
    {
      onSuccessMessage: options?.onSuccessMessage || 'Produto salvo com sucesso!',
      onErrorMessage: options?.onErrorMessage || 'Erro ao salvar produto',
      queryKeyToInvalidate: ['produtos', 'list']
    }
  );

  const { 
    insert: insertFichaTecnica, 
    remove: removeFichaTecnica 
  } = useSupabaseMutation<'ficha_tecnica'>(
    'ficha_tecnica',
    {
      queryKeyToInvalidate: ['produtos', 'list', 'ficha_tecnica']
    }
  );

  // Don't clear ingredients when product ID changes - this was causing the issue
  // We only want to clear ingredients when creating a new product, not when editing
  
  // Popula ingredientes ao carregar ficha tecnica
  useEffect(() => {
    if (fichaTecnica && currentProduto?.id) {
      console.log('Loaded ficha tecnica:', fichaTecnica);
      
      // Only set ingredients if we have ficha tecnica data and the ingredients array is empty
      // This prevents overwriting user edits when the effect runs multiple times
      if (fichaTecnica.length > 0) {
        setIngredientes(
          fichaTecnica.map(item => ({
            id: item.ingrediente_id,
            quantidade: item.quantidade_utilizada
          }))
        );
      }
    }
  }, [fichaTecnica, currentProduto?.id]);

  // Reset ingredientes when creating new
  const handleNewProduto = () => {
    setCurrentProduto({
      nome: '',
      rendimento: 1,
      tipo: 'Produto',
    });
    setIngredientes([]);
  };

  // Handle editing existing produto
  const handleEditProduto = (produto: ProdutoWithFichaTecnica) => {
    console.log('Editing produto:', produto);
    setCurrentProduto(produto);
    
    // If we have ficha_tecnica data directly on the produto, use it immediately
    if (produto.ficha_tecnica && produto.ficha_tecnica.length > 0) {
      console.log('Using ingredients from produto.ficha_tecnica:', produto.ficha_tecnica);
      setIngredientes(
        produto.ficha_tecnica.map(item => ({
          id: item.ingrediente_id,
          quantidade: item.quantidade_utilizada
        }))
      );
    } else {
      console.log('No ficha_tecnica on produto, will fetch separately');
    }
  };

  // Explicitly fetch ficha técnica when editing a product
  useEffect(() => {
    if (currentProduto?.id) {
      console.log('Fetching ficha tecnica for produto:', currentProduto.id);
      refetchFichaTecnica();
    }
  }, [currentProduto?.id, refetchFichaTecnica]);

  // Save produto and ficha tecnica
  const handleSaveProduto = async () => {
    if (!currentProduto?.nome || !currentProduto.rendimento) return false;
    try {
      let produtoId = currentProduto.id;
      // Insert or update produto
      if (!produtoId) {
        const produtoToInsert = {
          nome: currentProduto.nome,
          rendimento: currentProduto.rendimento,
          tipo: currentProduto.tipo || 'Produto',
          categoria_id: currentProduto.categoria_id,
          custo_total_receita: currentProduto.custo_total_receita,
          custo_por_porcao: currentProduto.custo_por_porcao,
          preco_definido:
            typeof currentProduto.preco_definido === 'string'
              ? (currentProduto.preco_definido as string).trim() === '' ? null : parseFloat(currentProduto.preco_definido as string)
              : currentProduto.preco_definido ?? null,
          preco_sugerido: currentProduto.preco_sugerido,
          margem: currentProduto.margem
        };
        console.log('Produto a ser inserido:', produtoToInsert);
        let newProduto;
        try {
          newProduto = await insertProduto(produtoToInsert);
        } catch (err) {
          toast.error('Erro real do Supabase: ' + (err?.message || JSON.stringify(err)));
          console.error('Erro real do Supabase ao inserir produto:', err);
          throw err;
        }
        produtoId = newProduto?.[0]?.id;
        if (!produtoId) throw new Error('Erro ao inserir produto');
      } else {
        await updateProduto({
          id: produtoId,
          data: {
            ...currentProduto,
            preco_definido:
              typeof currentProduto.preco_definido === 'string'
                ? (currentProduto.preco_definido as string).trim() === '' ? null : parseFloat(currentProduto.preco_definido as string)
                : currentProduto.preco_definido ?? null
          }
        });
        
        // First remove all existing ingredients for this product
        console.log('Removing existing ingredients for produto:', produtoId);
        await removeFichaTecnica('produto_id', produtoId);
      }
      
      // Filtrar ingredientes duplicados
      const ingredientesUnicos = ingredientes.filter((item, index, self) =>
        index === self.findIndex(i => i.id === item.id)
      );
      
      console.log('Ingredientes a serem inseridos:', ingredientesUnicos);
      
      // Insert ficha_tecnica
      if (produtoId) {
        console.log('ProdutoId para inserir ingredientes:', produtoId);
        for (const ingrediente of ingredientesUnicos) {
          if (ingrediente.quantidade > 0) {
            try {
              await insertFichaTecnica({
                produto_id: produtoId,
                ingrediente_id: ingrediente.id,
                quantidade_utilizada: ingrediente.quantidade
              });
            } catch (err) {
              console.error('Erro ao inserir ingrediente na ficha técnica:', err);
              throw err;
            }
          }
        }
      }
      
      toast.success('Ficha técnica salva com sucesso!');
      
      // Refetch ficha técnica e produtos para garantir sincronização
      await refetchFichaTecnica();
      await refetchProdutos();
      await queryClient.invalidateQueries({ queryKey: ['produtos', 'list'] });
      await queryClient.invalidateQueries({ queryKey: ['ficha_tecnica', 'by-produto', produtoId || ''] });
      
      return true;
    } catch (error: any) {
      toast.error('Erro ao salvar produto/ficha técnica: ' + (error?.message || error));
      console.error('Erro ao salvar produto/ficha técnica:', error);
      return false;
    }
  };

  return {
    produtos,
    isLoading,
    currentProduto,
    setCurrentProduto,
    ingredientes,
    setIngredientes,
    handleNewProduto,
    handleEditProduto,
    handleSaveProduto,
    refetchFichaTecnica
  };
}
