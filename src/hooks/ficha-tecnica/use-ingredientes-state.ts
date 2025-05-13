
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
      console.log('Loaded ficha tecnica:', fichaTecnica);
      
      // Only set ingredients if we have ficha tecnica data
      if (fichaTecnica.length > 0) {
        // Create a map to handle potential duplicates from the database
        const ingredientMap = new Map<string, number>();
        
        // Collect all ingredients with their quantities
        fichaTecnica.forEach(item => {
          if (ingredientMap.has(item.ingrediente_id)) {
            // If duplicate, use the highest quantity (should not happen, but just in case)
            const existingQty = ingredientMap.get(item.ingrediente_id) || 0;
            if (item.quantidade_utilizada > existingQty) {
              ingredientMap.set(item.ingrediente_id, item.quantidade_utilizada);
            }
          } else {
            ingredientMap.set(item.ingrediente_id, item.quantidade_utilizada);
          }
        });
        
        // Convert map to array of ingredients
        const uniqueIngredientes = Array.from(ingredientMap.entries()).map(([id, quantidade]) => ({
          id,
          quantidade
        }));
        
        console.log('Setting unique ingredients:', uniqueIngredientes);
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
