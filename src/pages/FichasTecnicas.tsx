
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFichaTecnica } from '@/hooks/use-ficha-tecnica';
import ProdutoDataTable from '@/components/fichas-tecnicas/ProdutoDataTable';
import FichaTecnicaSheet from '@/components/fichas-tecnicas/FichaTecnicaSheet';
import { useSupabaseMutation } from '@/hooks/use-supabase';
import { toast } from '@/components/ui/sonner';

export default function FichasTecnicas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const {
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
  } = useFichaTecnica();

  const { remove: deleteProduto } = useSupabaseMutation<'produtos'>('produtos', {
    onSuccessMessage: 'Produtos excluídos!',
    onErrorMessage: 'Erro ao excluir produtos',
    queryKeyToInvalidate: ['produtos', 'list']
  });

  const handleNewClick = () => {
    handleNewProduto();
    setIsFormOpen(true);
  };

  const handleEditClick = (produto: any) => {
    console.log('Edit clicked for produto:', produto);
    handleEditProduto(produto);
    
    // Force fetch ficha tecnica data after a short delay to ensure everything is loaded
    setTimeout(() => {
      refetchFichaTecnica();
    }, 100);
    
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

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      if (window.confirm('Tem certeza que deseja excluir os produtos selecionados? Esta ação é irreversível!')) {
        for (const id of selectedIds) {
          await deleteProduto(id);
        }
        setSelectedIds([]);
        toast.success('Produtos excluídos com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast.error('Erro ao excluir produtos');
    }
  };

  return (
    <>
      <PageHeader 
        title="Fichas Técnicas" 
        description="Gerencie as fichas técnicas de seus produtos"
        onNewItem={handleNewClick}
        newItemLabel="Nova Ficha Técnica"
      />
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={handleDeleteSelected}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          disabled={selectedIds.length === 0}
        >
          Excluir Selecionados
        </button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutoDataTable 
            produtos={produtos || []}
            isLoading={isLoading}
            onEditClick={handleEditClick}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
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
