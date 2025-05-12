
import React, { useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import FichaTecnicaForm from '@/components/fichas-tecnicas/FichaTecnicaForm';
import { ProdutoWithFichaTecnica, IngredienteQuantidade } from '@/types/ficha-tecnica.types';

interface FichaTecnicaSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProduto: Partial<ProdutoWithFichaTecnica> | null;
  setCurrentProduto: React.Dispatch<React.SetStateAction<Partial<ProdutoWithFichaTecnica> | null>>;
  ingredientes: IngredienteQuantidade[];
  setIngredientes: React.Dispatch<React.SetStateAction<IngredienteQuantidade[]>>;
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
  // Log when the sheet opens with product and ingredients data
  useEffect(() => {
    if (isOpen) {
      console.log('Sheet opened with produto:', currentProduto);
      console.log('Ingredients loaded:', ingredientes);
    }
  }, [isOpen, currentProduto, ingredientes]);
  
  const handleSave = async () => {
    console.log('Saving with ingredients:', ingredientes);
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
