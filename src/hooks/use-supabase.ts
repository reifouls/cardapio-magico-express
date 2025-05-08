
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Database } from '@/integrations/supabase/types';

type TablesSchema = Database['public']['Tables'];

/**
 * Hook for querying data from Supabase with strong typing
 */
export function useSupabaseQuery<
  TableName extends keyof TablesSchema,
  ReturnType = TablesSchema[TableName]['Row'][]
>(
  tableName: TableName,
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
    queryKey: [tableName as string, ...queryKey],
    queryFn: async () => {
      let query = supabase
        .from(tableName as string)
        .select(options?.select || '*');

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // @ts-ignore - Using eq method dynamically
            query = query.eq(key, value);
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

      return data as ReturnType;
    },
  });
}

/**
 * Hook for mutations (insert, update, delete) to Supabase tables with strong typing
 */
export function useSupabaseMutation<TableName extends keyof TablesSchema>(
  tableName: TableName,
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
    queryKeyToInvalidate?: string[];
  }
) {
  const queryClient = useQueryClient();
  
  // Insert mutation
  const insertMutation = useMutation({
    mutationFn: async (newData: Partial<TablesSchema[TableName]['Insert']>) => {
      const { data, error } = await supabase
        .from(tableName as string)
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
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<TablesSchema[TableName]['Update']> 
    }) => {
      const { data: responseData, error } = await supabase
        .from(tableName as string)
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
        .from(tableName as string)
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
export function useSupabaseSelect<TableName extends keyof TablesSchema>(
  tableName: TableName,
  column: string,
  queryKey: string[]
) {
  return useQuery({
    queryKey: [tableName as string, 'select', ...queryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName as string)
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
