
import React from 'react';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { ProdutoWithFichaTecnica } from '@/hooks/use-ficha-tecnica';

interface ProdutoDataTableProps {
  produtos: ProdutoWithFichaTecnica[];
  isLoading: boolean;
  onEditClick: (produto: ProdutoWithFichaTecnica) => void;
}

const ProdutoDataTable: React.FC<ProdutoDataTableProps> = ({
  produtos,
  isLoading,
  onEditClick
}) => {
  const columns = [
    {
      header: "Nome",
      accessorKey: "nome"
    },
    {
      header: "Categoria",
      accessorKey: "categoria.nome",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => 
        info.row.original.categoria?.nome || "-"
    },
    {
      header: "Rendimento",
      accessorKey: "rendimento",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => 
        `${info.row.original.rendimento} porções`
    },
    {
      header: "Custo Total",
      accessorKey: "custo_total_receita",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => 
        formatCurrency(info.row.original.custo_total_receita || 0)
    },
    {
      header: "Custo por Porção",
      accessorKey: "custo_por_porcao",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => 
        formatCurrency(info.row.original.custo_por_porcao || 0)
    },
    {
      header: "Preço",
      accessorKey: "preco_definido",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => 
        formatCurrency(info.row.original.preco_definido || info.row.original.preco_sugerido || 0)
    },
    {
      header: "Margem",
      accessorKey: "margem",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => 
        formatarPercentual(info.row.original.margem || 0)
    }
  ];

  return (
    <DataTable 
      data={produtos || []}
      columns={columns}
      onEdit={onEditClick}
      isLoading={isLoading}
    />
  );
};

export default ProdutoDataTable;
