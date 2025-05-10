
import { useState, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { Database } from '@/integrations/supabase/types';

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

  // Query for all produtos
  const { data: produtos, isLoading } = useSupabaseQuery<
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
      filter: { column: 'produto_id', value: currentProduto?.id || '' },
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
      onSuccessMessage: options?.onSuccessMessage || 'Ficha técnica salva com sucesso!',
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
    }
  }, [fichaTecnica, currentProduto]);

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
    setCurrentProduto(produto);
    setIngredientes([]);
    refetchFichaTecnica();
  };

  // Save produto and ficha tecnica
  const handleSaveProduto = async () => {
    if (!currentProduto?.nome || !currentProduto.rendimento) return;
    
    try {
      let produtoId = currentProduto.id;
      
      // Insert or update produto
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

      // Reset state
      return true;
    } catch (error) {
      console.error("Erro ao salvar:", error);
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
