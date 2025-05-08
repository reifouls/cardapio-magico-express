
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Database } from '@/integrations/supabase/types';

// Define table names as literal types for better type safety
type TableNames = keyof Database['public']['Tables'];

/**
 * Hook for querying data from Supabase with strong typing
 */
export function useSupabaseQuery<T extends TableNames, ReturnType = Database['public']['Tables'][T]['Row'][]>(
  tableName: T,
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
    queryKey: [tableName, ...queryKey],
    queryFn: async () => {
      let query = supabase
        .from(tableName)
        .select(options?.select || '*');

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Need to use any here due to dynamic method call
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

      return data as ReturnType;
    },
  });
}

/**
 * Hook for mutations (insert, update, delete) to Supabase tables with strong typing
 */
export function useSupabaseMutation<T extends TableNames>(
  tableName: T,
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
    queryKeyToInvalidate?: string[];
  }
) {
  const queryClient = useQueryClient();
  
  // Insert mutation
  const insertMutation = useMutation({
    mutationFn: async (newData: Database['public']['Tables'][T]['Insert']) => {
      const { data, error } = await supabase
        .from(tableName)
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
      data: Database['public']['Tables'][T]['Update'] 
    }) => {
      const { data: responseData, error } = await supabase
        .from(tableName)
        .update(data as any)
        .eq('id', id as any) // Using 'as any' to bypass strict type checking for the id column
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
        .from(tableName)
        .delete()
        .eq('id', id as any); // Using 'as any' to bypass strict type checking for the id column

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
export function useSupabaseSelect<T extends TableNames>(
  tableName: T,
  column: string,
  queryKey: string[]
) {
  return useQuery({
    queryKey: [tableName, 'select', ...queryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
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
