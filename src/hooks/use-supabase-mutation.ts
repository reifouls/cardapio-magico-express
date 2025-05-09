
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Database } from '@/integrations/supabase/types';
import { TableNames } from './use-supabase-query';

type MutationOptions = {
  onSuccessMessage?: string;
  onErrorMessage?: string;
  queryKeyToInvalidate?: string[];
};

/**
 * Hook for mutations (insert, update, delete) to Supabase tables with strong typing
 */
export function useSupabaseMutation<T extends TableNames>(
  tableName: T,
  options?: MutationOptions
) {
  const queryClient = useQueryClient();
  
  // Insert mutation
  const insertMutation = useMutation({
    mutationFn: async (newData: Database['public']['Tables'][T]['Insert']) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newData as any) // Type cast needed due to Supabase client limitations
        .select();

      if (error) {
        console.error('Error inserting data:', error);
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
      toast.error(options?.onErrorMessage || `Error: ${error.message}`);
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
        .update(data as any) // Type cast needed due to Supabase client limitations
        .eq('id' as any, id) // Type cast needed due to Supabase client limitations
        .select();

      if (error) {
        console.error('Error updating data:', error);
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
      toast.error(options?.onErrorMessage || `Error: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id' as any, id); // Type cast needed due to Supabase client limitations

      if (error) {
        console.error('Error deleting data:', error);
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
      toast.error(options?.onErrorMessage || `Error: ${error.message}`);
    },
  });

  // Remove by column mutation - adding a specialized method for removing by any column
  const removeByColumnMutation = useMutation({
    mutationFn: async (column: string, value: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(column as any, value); // Type cast needed due to Supabase client limitations

      if (error) {
        console.error('Error removing data:', error);
        throw error;
      }
      
      return value;
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
      toast.error(options?.onErrorMessage || `Error: ${error.message}`);
    },
  });

  return {
    insert: insertMutation.mutate,
    update: updateMutation.mutate,
    remove: (columnOrId: string, value?: string) => {
      // If value is provided, use removeByColumn, otherwise use delete by id
      if (value !== undefined) {
        return removeByColumnMutation.mutate(columnOrId, value);
      } else {
        return deleteMutation.mutate(columnOrId);
      }
    },
    insertAsync: insertMutation.mutateAsync,
    updateAsync: updateMutation.mutateAsync,
    removeAsync: deleteMutation.mutateAsync,
    isLoading: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending || removeByColumnMutation.isPending,
  };
}
