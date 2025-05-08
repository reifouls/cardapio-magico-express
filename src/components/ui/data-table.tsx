
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (info: { row: { original: T } }) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  isLoading = false
}: DataTableProps<T>) {
  if (isLoading) {
    return <div className="w-full text-center py-8">Carregando...</div>;
  }

  if (data.length === 0) {
    return <div className="w-full text-center py-8">Nenhum registro encontrado.</div>;
  }

  const getValue = (row: T, accessorKey: keyof T | string): React.ReactNode => {
    if (typeof accessorKey === 'string' && accessorKey.includes('.')) {
      // Handle nested properties
      const keys = accessorKey.split('.');
      let value: any = row;
      
      for (const key of keys) {
        if (value === null || value === undefined) return null;
        value = value[key as keyof typeof value];
      }
      
      return value;
    }
    
    return (row as any)[accessorKey];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
            {(onEdit || onDelete) && <TableHead className="w-[100px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column, index) => (
                <TableCell key={index}>
                  {column.cell 
                    ? column.cell({ row: { original: row } }) 
                    : getValue(row, column.accessorKey)}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell>
                  <div className="flex gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
