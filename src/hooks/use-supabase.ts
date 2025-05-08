
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tables } from '@/integrations/supabase/types';

// Define a type for valid table names based on the Supabase schema
type TableName = keyof Database['public']['Tables'];
type ValidTable = TableName;

// Helper type to make TypeScript happy with our table parameters
type TableRow<T extends ValidTable> = Tables<T>;

export function useSupabaseQuery<T extends ValidTable, R = TableRow<T>>(
  table: T,
  queryKey: string[],
  options?: {
    select?: string;
    order?: string;
    filter?: Record<string, any>;
    limit?: number;
    single?: boolean;
  }
) {
  return useQuery({
    queryKey: [table, ...queryKey],
    queryFn: async () => {
      let query = supabase
        .from(table)
        .select(options?.select || '*');

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Using type assertion to handle typing issues
            query = query.eq(key, value) as any;
          }
        });
      }

      if (options?.order) {
        query = query.order(options.order);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = options?.single
        ? await query.single()
        : await query;

      if (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error(`Erro ao buscar dados: ${error.message}`);
        throw error;
      }

      return data as R;
    },
  });
}

export function useSupabaseMutation<T extends ValidTable>(
  table: T,
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
    queryKeyToInvalidate?: string[];
  }
) {
  const queryClient = useQueryClient();
  
  // Insert mutation
  const insertMutation = useMutation({
    mutationFn: async (newData: Partial<TableRow<T>>) => {
      const { data, error } = await supabase
        .from(table)
        .insert(newData)
        .select();

      if (error) {
        console.error('Erro ao inserir dados:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      if (options?.onSuccessMessage) {
        toast.success(options.onSuccessMessage);
      }
      if (options?.queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: options.queryKeyToInvalidate });
      }
    },
    onError: (error: any) => {
      toast.error(options?.onErrorMessage || `Erro: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TableRow<T>> }) => {
      const { data: responseData, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao atualizar dados:', error);
        throw error;
      }
      
      return responseData;
    },
    onSuccess: () => {
      if (options?.onSuccessMessage) {
        toast.success(options.onSuccessMessage);
      }
      if (options?.queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: options.queryKeyToInvalidate });
      }
    },
    onError: (error: any) => {
      toast.error(options?.onErrorMessage || `Erro: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir dados:', error);
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      if (options?.onSuccessMessage) {
        toast.success(options.onSuccessMessage);
      }
      if (options?.queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: options.queryKeyToInvalidate });
      }
    },
    onError: (error: any) => {
      toast.error(options?.onErrorMessage || `Erro: ${error.message}`);
    },
  });

  return {
    insert: insertMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    insertAsync: insertMutation.mutateAsync,
    updateAsync: updateMutation.mutateAsync,
    removeAsync: deleteMutation.mutateAsync,
    isLoading: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

export function useSupabaseSelect<T extends ValidTable>(
  table: T,
  column: string,
  queryKey: string[]
) {
  return useQuery({
    queryKey: [table, 'select', ...queryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .order(column);

      if (error) {
        console.error('Erro ao buscar opções:', error);
        toast.error(`Erro ao buscar opções: ${error.message}`);
        throw error;
      }

      return data.map((item: any) => ({
        value: item.id,
        label: item[column]
      }));
    },
  });
}

// Add a type declaration to make TypeScript happy
type Database = {
  public: {
    Tables: {
      categorias: unknown;
      combo_produtos: unknown;
      combos: unknown;
      produtos: unknown;
      Emails_lp_bussola: unknown;
      ficha_tecnica: unknown;
      ingredientes: unknown;
      popularidade: unknown;
      premissas_capacidade_produtiva: unknown;
      premissas_custo_hora: unknown;
      premissas_despesas_fixas: unknown;
      premissas_markup: unknown;
      premissas_preco: unknown;
      regras_arredondamento: unknown;
      sugestoes: unknown;
      vendas: unknown;
    }
  }
};
