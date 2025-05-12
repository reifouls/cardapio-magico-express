
import { useState } from 'react';
import { ProdutoWithFichaTecnica } from '@/types/ficha-tecnica.types';

export function useProdutoState() {
  const [currentProduto, setCurrentProduto] = useState<Partial<ProdutoWithFichaTecnica> | null>(null);
  
  const handleNewProduto = () => {
    setCurrentProduto({
      nome: '',
      rendimento: 1,
      tipo: 'Produto',
    });
  };

  const handleEditProduto = (produto: ProdutoWithFichaTecnica) => {
    console.log('Editing produto:', produto);
    setCurrentProduto(produto);
  };

  return {
    currentProduto,
    setCurrentProduto,
    handleNewProduto,
    handleEditProduto
  };
}
