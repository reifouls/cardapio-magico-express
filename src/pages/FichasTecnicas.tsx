
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFichaTecnica } from '@/hooks/use-ficha-tecnica';
import ProdutoDataTable from '@/components/fichas-tecnicas/ProdutoDataTable';
import FichaTecnicaSheet from '@/components/fichas-tecnicas/FichaTecnicaSheet';

export default function FichasTecnicas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const {
    produtos,
    isLoading,
    currentProduto,
    setCurrentProduto,
    ingredientes,
    setIngredientes,
    handleNewProduto,
    handleEditProduto,
    handleSaveProduto
  } = useFichaTecnica();

  const handleNewClick = () => {
    handleNewProduto();
    setIsFormOpen(true);
  };

  const handleEditClick = (produto: any) => {
    handleEditProduto(produto);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const success = await handleSaveProduto();
    if (success) {
      setCurrentProduto(null);
      setIngredientes([]);
    }
    return success;
  };

  return (
    <>
      <PageHeader 
        title="Fichas Técnicas" 
        description="Gerencie as fichas técnicas de seus produtos"
        onNewItem={handleNewClick}
        newItemLabel="Nova Ficha Técnica"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutoDataTable 
            produtos={produtos || []}
            isLoading={isLoading}
            onEditClick={handleEditClick}
          />
        </CardContent>
      </Card>

      <FichaTecnicaSheet
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        currentProduto={currentProduto}
        setCurrentProduto={setCurrentProduto}
        ingredientes={ingredientes}
        setIngredientes={setIngredientes}
        onSave={handleSave}
      />
    </>
  );
}
