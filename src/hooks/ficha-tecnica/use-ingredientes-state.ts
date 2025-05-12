
import { useState, useEffect } from 'react';
import { IngredienteQuantidade, FichaTecnica, Ingrediente } from '@/types/ficha-tecnica.types';

interface UseIngredientesStateProps {
  fichaTecnica?: (FichaTecnica & { ingrediente: Ingrediente })[];
  produtoId?: string;
}

export function useIngredientesState({ fichaTecnica, produtoId }: UseIngredientesStateProps) {
  const [ingredientes, setIngredientes] = useState<IngredienteQuantidade[]>([]);
  
  // Popula ingredientes ao carregar ficha tecnica
  useEffect(() => {
    if (fichaTecnica && produtoId) {
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
  }, [fichaTecnica, produtoId]);

  return {
    ingredientes,
    setIngredientes
  };
}
