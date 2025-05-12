
import { Database } from '@/integrations/supabase/types';

// Define proper types for our data
export type Produto = Database['public']['Tables']['produtos']['Row'];
export type FichaTecnica = Database['public']['Tables']['ficha_tecnica']['Row'];
export type Ingrediente = Database['public']['Tables']['ingredientes']['Row'];

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

export interface IngredienteQuantidade {
  id: string;
  quantidade: number;
}

export interface UseFichaTecnicaOptions {
  onSuccessMessage?: string;
  onErrorMessage?: string;
}
