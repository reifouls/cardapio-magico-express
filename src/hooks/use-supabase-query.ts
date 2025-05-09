
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
    enabled?: boolean;
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
            const { column, operator = 'eq', value: filterValue } = 
              typeof value === 'object' && value.column 
                ? value 
                : { column: key, value };
            
            switch (operator) {
              case 'eq':
                query = query.eq(column, filterValue) as any;
                break;
              case 'neq':
                query = query.neq(column, filterValue) as any;
                break;
              case 'gt':
                query = query.gt(column, filterValue) as any;
                break;
              case 'lt':
                query = query.lt(column, filterValue) as any;
                break;
              case 'gte':
                query = query.gte(column, filterValue) as any;
                break;
              case 'lte':
                query = query.lte(column, filterValue) as any;
                break;
              case 'like':
                query = query.like(column, filterValue) as any;
                break;
              case 'ilike':
                query = query.ilike(column, filterValue) as any;
                break;
              default:
                query = query.eq(column, filterValue) as any;
            }
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
    enabled: options?.enabled !== false // Default to true if not specified
  });
}
