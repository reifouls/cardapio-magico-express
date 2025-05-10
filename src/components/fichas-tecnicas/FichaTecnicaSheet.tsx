
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import FichaTecnicaForm from '@/components/fichas-tecnicas/FichaTecnicaForm';
import { Database } from '@/integrations/supabase/types';

type Produto = Database['public']['Tables']['produtos']['Row'];

interface FichaTecnicaSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProduto: Partial<Produto> | null;
  setCurrentProduto: React.Dispatch<React.SetStateAction<Partial<Produto> | null>>;
  ingredientes: {id: string, quantidade: number}[];
  setIngredientes: React.Dispatch<React.SetStateAction<{id: string, quantidade: number}[]>>;
  onSave: () => Promise<boolean>;
}

const FichaTecnicaSheet: React.FC<FichaTecnicaSheetProps> = ({
  isOpen,
  onOpenChange,
  currentProduto,
  setCurrentProduto,
  ingredientes,
  setIngredientes,
  onSave
}) => {
  const handleSave = async () => {
    const success = await onSave();
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
  );
};

export default FichaTecnicaSheet;
