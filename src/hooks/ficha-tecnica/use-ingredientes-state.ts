import { useState, useEffect } from 'react';
import { IngredienteQuantidade, FichaTecnica, Ingrediente } from '@/types/ficha-tecnica.types';

interface UseIngredientesStateProps {
  fichaTecnica?: (FichaTecnica & { ingrediente: Ingrediente })[];
  produtoId?: string;
}

export function useIngredientesState({ fichaTecnica, produtoId }: UseIngredientesStateProps) {
  const [ingredientes, setIngredientes] = useState<IngredienteQuantidade[]>([]);
  const [ingredientesLoaded, setIngredientesLoaded] = useState<boolean>(false);
  
  // Popula ingredientes ao carregar ficha tecnica
  useEffect(() => {
    // Reset loading state when product ID changes
    if (produtoId !== undefined) {
      setIngredientesLoaded(false);
    }
    
    if (fichaTecnica && produtoId) {
      console.log('Loading ficha tecnica:', fichaTecnica);
      
      // Only set ingredients if we have ficha tecnica data
      if (fichaTecnica.length > 0) {
        const ingredientesMap = new Map<string, number>();
        
        // Collect all ingredients with their quantities
        fichaTecnica.forEach(item => {
          ingredientesMap.set(item.ingrediente_id, item.quantidade_utilizada);
        });
        
        // Convert map to array of ingredients
        const uniqueIngredientes = Array.from(ingredientesMap.entries()).map(([id, quantidade]) => ({
          id,
          quantidade
        }));
        
        console.log('Setting ingredients:', uniqueIngredientes);
        setIngredientes(uniqueIngredientes);
      } else {
        console.log('No ficha tecnica data, resetting ingredients');
        setIngredientes([]);
      }
      
      // Mark as loaded
      setIngredientesLoaded(true);
    }
  }, [fichaTecnica, produtoId]);

  return {
    ingredientes,
    setIngredientes,
    ingredientesLoaded
  };
}