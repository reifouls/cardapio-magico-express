
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { TableNames } from './use-supabase-query';

type SelectOption = {
  value: string;
  label: string;
};

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
        console.error('Error fetching options:', error);
        toast.error(`Error fetching options: ${error.message}`);
        throw error;
      }

      // Type assertion to ensure TypeScript knows the structure of our data
      return (data || []).map((item: any) => ({
        value: item.id,
        label: item[column]
      })) as SelectOption[];
    },
  });
}
