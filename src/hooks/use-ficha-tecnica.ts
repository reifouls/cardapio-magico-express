
import { useEffect } from 'react';
import { useSupabaseQuery } from '@/hooks/use-supabase';
import { ProdutoWithFichaTecnica, UseFichaTecnicaOptions } from '@/types/ficha-tecnica.types';
import { useProdutoState } from '@/hooks/ficha-tecnica/use-produto-state';
import { useIngredientesState } from '@/hooks/ficha-tecnica/use-ingredientes-state';
import { useSaveProduto } from '@/hooks/ficha-tecnica/use-save-produto';

export { ProdutoWithFichaTecnica };

export function useFichaTecnica(options?: UseFichaTecnicaOptions) {
  const {
    currentProduto,
    setCurrentProduto,
    handleNewProduto,
    handleEditProduto
  } = useProdutoState();

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

  // Initialize ingredients state
  const {
    ingredientes,
    setIngredientes
  } = useIngredientesState({ 
    fichaTecnica, 
    produtoId: currentProduto?.id 
  });

  // Initialize save produto functionality
  const { handleSaveProduto } = useSaveProduto({
    currentProduto,
    ingredientes,
    options
  });

  // Explicitly fetch ficha técnica when editing a product
  useEffect(() => {
    if (currentProduto?.id) {
      console.log('Fetching ficha tecnica for produto:', currentProduto.id);
      refetchFichaTecnica();
    }
  }, [currentProduto?.id, refetchFichaTecnica]);

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
