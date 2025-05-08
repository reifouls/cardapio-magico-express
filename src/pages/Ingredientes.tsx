
import React, { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tables } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

type Ingrediente = Tables<'ingredientes'>;

export default function Ingredientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentIngrediente, setCurrentIngrediente] = useState<Partial<Ingrediente> | null>(null);

  const { data: ingredientes, isLoading } = useSupabaseQuery<Ingrediente[]>(
    'ingredientes',
    ['list'],
    { order: 'nome' }
  );

  const { insert: insertIngrediente, update: updateIngrediente, remove: deleteIngrediente } = 
    useSupabaseMutation<Ingrediente>(
      'ingredientes',
      {
        onSuccessMessage: 'Ingrediente salvo com sucesso!',
        onErrorMessage: 'Erro ao salvar ingrediente',
        queryKeyToInvalidate: ['ingredientes', 'list']
      }
    );

  const handleNewClick = () => {
    setCurrentIngrediente({
      nome: '',
      tipo: 'insumo',
      unidade: 'kg',
      custo_unitario: 0,
      fornecedor: ''
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (ingrediente: Ingrediente) => {
    setCurrentIngrediente(ingrediente);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (ingrediente: Ingrediente) => {
    if (window.confirm(`Deseja realmente excluir o ingrediente "${ingrediente.nome}"?`)) {
      await deleteIngrediente(ingrediente.id);
    }
  };

  const handleSave = async () => {
    if (!currentIngrediente?.nome || !currentIngrediente.unidade) return;
    
    try {
      if (currentIngrediente.id) {
        // Update existing ingrediente
        await updateIngrediente({
          id: currentIngrediente.id,
          data: {
            nome: currentIngrediente.nome,
            tipo: currentIngrediente.tipo,
            unidade: currentIngrediente.unidade,
            custo_unitario: currentIngrediente.custo_unitario,
            fornecedor: currentIngrediente.fornecedor
          }
        });
      } else {
        // Insert new ingrediente
        await insertIngrediente({
          nome: currentIngrediente.nome,
          tipo: currentIngrediente.tipo,
          unidade: currentIngrediente.unidade,
          custo_unitario: currentIngrediente.custo_unitario || 0,
          fornecedor: currentIngrediente.fornecedor
        });
      }

      setIsFormOpen(false);
      setCurrentIngrediente(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const tiposOptions = [
    { value: 'insumo', label: 'Insumo' },
    { value: 'embalagem', label: 'Embalagem' }
  ];

  const unidadesOptions = [
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'g', label: 'Grama (g)' },
    { value: 'L', label: 'Litro (L)' },
    { value: 'ml', label: 'Mililitro (ml)' },
    { value: 'un', label: 'Unidade (un)' },
    { value: 'cx', label: 'Caixa (cx)' },
    { value: 'pc', label: 'Pacote (pc)' }
  ];

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome"
    },
    {
      header: "Tipo",
      accessorKey: "tipo",
      cell: (row: Ingrediente) => row.tipo === 'insumo' ? 'Insumo' : 'Embalagem'
    },
    {
      header: "Unidade",
      accessorKey: "unidade"
    },
    {
      header: "Custo Unitário",
      accessorKey: "custo_unitario",
      cell: (row: Ingrediente) => formatCurrency(row.custo_unitario)
    },
    {
      header: "Fornecedor",
      accessorKey: "fornecedor",
      cell: (row: Ingrediente) => row.fornecedor || '-'
    }
  ];

  return (
    <>
      <PageHeader 
        title="Ingredientes" 
        description="Gerencie os insumos e embalagens utilizados nas fichas técnicas"
        onNewItem={handleNewClick}
        newItemLabel="Novo Ingrediente"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={ingredientes || []}
            columns={columns}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentIngrediente?.id ? 'Editar Ingrediente' : 'Novo Ingrediente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={currentIngrediente?.nome || ''}
                onChange={(e) => setCurrentIngrediente({...currentIngrediente!, nome: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={currentIngrediente?.tipo || 'insumo'} 
                  onValueChange={(value) => setCurrentIngrediente({...currentIngrediente!, tipo: value})}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select 
                  value={currentIngrediente?.unidade || 'kg'} 
                  onValueChange={(value) => setCurrentIngrediente({...currentIngrediente!, unidade: value})}
                >
                  <SelectTrigger id="unidade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custo">Custo Unitário (R$)</Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                value={currentIngrediente?.custo_unitario || ''}
                onChange={(e) => setCurrentIngrediente(
                  {...currentIngrediente!, custo_unitario: parseFloat(e.target.value) || 0}
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor (opcional)</Label>
              <Input
                id="fornecedor"
                value={currentIngrediente?.fornecedor || ''}
                onChange={(e) => setCurrentIngrediente({...currentIngrediente!, fornecedor: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Salvar Ingrediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
