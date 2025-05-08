
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatarPercentual } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentesListProps {
  title: string;
  items: Array<{
    id: string;
    nome: string;
    valor?: number;
    data?: string;
    status?: string;
  }>;
  columns: Array<{
    header: string;
    accessorKey: string;
    cell?: (item: any) => React.ReactNode;
  }>;
  emptyMessage: string;
  viewAllHref: string;
}

export function RecentesList({ title, items, columns, emptyMessage, viewAllHref }: RecentesListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 5).map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {column.cell ? column.cell(item) : (item as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="ghost" asChild className="ml-auto">
          <Link to={viewAllHref}>
            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
