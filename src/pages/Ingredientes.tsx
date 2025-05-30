
import React, { useState, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Search } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { usePerformance } from '@/hooks/usePerformance';
import { useMeasurePerformance } from '@/hooks/useMeasurePerformance';
import { useEffect } from 'react';

// Define the Ingrediente type from the database
type Ingrediente = Database['public']['Tables']['ingredientes']['Row'] & {
  sequencial?: number;
};

export default function Ingredientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentIngrediente, setCurrentIngrediente] = useState<Partial<Ingrediente> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Initialize measure before using it
  const measure = useMeasurePerformance();
  usePerformance('ingredientes-page-render');

  const { data: ingredientes, isLoading } = useSupabaseQuery<
    'ingredientes',
    false,
    Ingrediente[]
  >(
    'ingredientes',
    ['list'],
    { 
      order: 'nome' ,
    }
  );
  
  // Use useEffect to handle the measurement after data is loaded
  useEffect(() => {
    if (ingredientes) {
      measure('ingredientes-data-load', async () => {
        // Simula uma operação assíncrona para demonstração
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    }
  }, [ingredientes, measure]);

  const { insert: insertIngrediente, update: updateIngrediente, remove: deleteIngrediente } = 
    useSupabaseMutation<'ingredientes'>(
      'ingredientes',
      {
        onSuccessMessage: 'Ingrediente salvo com sucesso!',
        onErrorMessage: 'Erro ao salvar ingrediente',
        queryKeyToInvalidate: ['ingredientes', 'list']
      }
    );
    
  // Add sequential ID to each ingredient
  const ingredientesWithSequential = useMemo(() => {
    if (!ingredientes) return [];
    
    return ingredientes.map((ingrediente, index) => ({
      ...ingrediente,
      sequencial: index + 1
    }));
  }, [ingredientes]);
  
  // Apply search filter
  const filteredIngredientes = useMemo(() => {
    if (!searchTerm.trim()) return ingredientesWithSequential;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return ingredientesWithSequential.filter(ingrediente => 
      ingrediente.nome.toLowerCase().includes(lowerSearchTerm) || 
      (ingrediente.fornecedor && ingrediente.fornecedor.toLowerCase().includes(lowerSearchTerm))
    );
  }, [ingredientesWithSequential, searchTerm]);

  // Verificar se o ingrediente está em uso em alguma ficha técnica
  const verificarUsoIngrediente = async (ingredienteId: string) => {
    const { count } = await supabase
      .from('ficha_tecnica')
      .select('*', { count: 'exact', head: true })
      .eq('ingrediente_id', ingredienteId);
      
    return count && count > 0;
  };

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
    // Verificar se o ingrediente está em uso
    const emUso = await verificarUsoIngrediente(ingrediente.id);
    
    if (emUso) {
      toast.error(`Ingrediente "${ingrediente.nome}" em uso - exclusão bloqueada`, {
        description: "Este ingrediente está sendo usado em uma ou mais fichas técnicas."
      });
      return;
    }
    
    // Se não estiver em uso, confirmar e deletar
    if (window.confirm(`Deseja realmente excluir o ingrediente "${ingrediente.nome}"?`)) {
      await deleteIngrediente(ingrediente.id);
    }
  };

  const handleSave = async () => {
    if (!currentIngrediente?.nome || !currentIngrediente.unidade) return;
    
    try {
      await measure('ingredientes-save', async () => {
        if (currentIngrediente.id) {
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
          await insertIngrediente({
            nome: currentIngrediente.nome,
            tipo: currentIngrediente.tipo,
            unidade: currentIngrediente.unidade,
            custo_unitario: currentIngrediente.custo_unitario || 0,
            fornecedor: currentIngrediente.fornecedor
          });
        }
      });

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

  // Define columns with proper typing for DataTable
  const columns = [
    {
      header: "ID",
      accessorKey: "sequencial"
    },
    {
      header: "Nome",
      accessorKey: "nome"
    },
    {
      header: "Tipo",
      accessorKey: "tipo",
      cell: (info: { row: { original: Ingrediente } }) => 
        info.row.original.tipo === 'insumo' ? 'Insumo' : 'Embalagem'
    },
    {
      header: "Unidade",
      accessorKey: "unidade"
    },
    {
      header: "Custo Unitário",
      accessorKey: "custo_unitario",
      cell: (info: { row: { original: Ingrediente } }) => 
        formatCurrency(info.row.original.custo_unitario)
    },
    {
      header: "Fornecedor",
      accessorKey: "fornecedor",
      cell: (info: { row: { original: Ingrediente } }) => 
        info.row.original.fornecedor || '-'
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
        <CardHeader className="flex-row justify-between items-center space-y-0">
          <CardTitle>Lista de Ingredientes</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={filteredIngredientes}
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
