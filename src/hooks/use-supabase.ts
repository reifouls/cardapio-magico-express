
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tables } from '@/integrations/supabase/types';
import { PostgrestFilterBuilder } from '@supabase/supabase-js';

// Define valid table names
type TableName = keyof Database['public']['Tables'];

/**
 * Hook for querying data from Supabase with strong typing
 */
export function useSupabaseQuery<T extends TableName, R = Tables<T>[]>(
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
            // Using type assertion for PostgrestFilterBuilder methods
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

/**
 * Hook for mutations (insert, update, delete) to Supabase tables with strong typing
 */
export function useSupabaseMutation<T extends TableName>(
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
    mutationFn: async (newData: Partial<Tables<T>>) => {
      const { data, error } = await supabase
        .from(table)
        .insert(newData as any)
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tables<T>> }) => {
      const { data: responseData, error } = await supabase
        .from(table)
        .update(data as any)
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

/**
 * Hook for selecting options from a table column, formatted for dropdowns
 */
export function useSupabaseSelect<T extends TableName>(
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

// Type declaration for Supabase Database schema
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
