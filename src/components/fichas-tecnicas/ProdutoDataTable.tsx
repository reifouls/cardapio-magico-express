
import React from 'react';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency, formatarPercentual } from '@/lib/utils';
import { ProdutoWithFichaTecnica } from '@/types/ficha-tecnica.types';

interface ProdutoDataTableProps {
  produtos: ProdutoWithFichaTecnica[];
  isLoading: boolean;
  onEditClick: (produto: ProdutoWithFichaTecnica) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

const ProdutoDataTable: React.FC<ProdutoDataTableProps> = ({
  produtos,
  isLoading,
  onEditClick,
  selectedIds,
  setSelectedIds
}) => {
  const allSelected = produtos.length > 0 && selectedIds.length === produtos.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(produtos.map(p => p.id));
  };
  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const columns = [
    {
      header: "Selecionar",
      accessorKey: "select",
      cell: (info: { row: { original: ProdutoWithFichaTecnica } }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(info.row.original.id)}
          onChange={() => toggleOne(info.row.original.id)}
        />
      )
    },
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
    <>
      <div style={{ marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
        /> Selecionar todos
      </div>
      <DataTable 
        data={produtos || []}
        columns={columns}
        onEdit={onEditClick}
        isLoading={isLoading}
      />
    </>
  );
};

export default ProdutoDataTable;
