
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Database } from '@/integrations/supabase/types';

// Define table names as literal types for better type safety
export type TableNames = keyof Database['public']['Tables'];

/**
 * Hook for querying data from Supabase with strong typing
 */
export function useSupabaseQuery<
  T extends TableNames,
  IsSingle extends boolean = false,
  ReturnType = IsSingle extends true 
    ? Database['public']['Tables'][T]['Row'] 
    : Database['public']['Tables'][T]['Row'][]
>(
  tableName: T,
  queryKey: string[],
  options?: {
    select?: string;
    order?: string;
    filter?: Record<string, any>;
    limit?: number;
    single?: IsSingle;
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
        console.error('Error fetching data:', error);
        toast.error(`Error fetching data: ${error.message}`);
        throw error;
      }

      return data as ReturnType;
    },
  });
}
