
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { formatarPercentual } from "@/lib/utils";
import { useProdutoIndicadores } from "@/hooks/useChartsData";

export const ProductIndicators: React.FC = () => {
  const { data: indicadoresProdutos = { 
    maiorMargem: null,
    menorMargem: null, 
    maisVendido: null 
  }} = useProdutoIndicadores();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Produtos com maior margem
          </CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {indicadoresProdutos.maiorMargem ? (
            <>
              <div className="text-2xl font-bold">
                {formatarPercentual(indicadoresProdutos.maiorMargem.margem)}
              </div>
              <p className="text-xs text-muted-foreground">
                {indicadoresProdutos.maiorMargem.nome}
              </p>
            </>
          ) : (
            <div className="py-2 text-muted-foreground text-sm">Sem dados disponíveis</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Produtos com menor margem
          </CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {indicadoresProdutos.menorMargem ? (
            <>
              <div className="text-2xl font-bold">
                {formatarPercentual(indicadoresProdutos.menorMargem.margem)}
              </div>
              <p className="text-xs text-muted-foreground">
                {indicadoresProdutos.menorMargem.nome}
              </p>
            </>
          ) : (
            <div className="py-2 text-muted-foreground text-sm">Sem dados disponíveis</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Produto mais vendido
          </CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {indicadoresProdutos.maisVendido ? (
            <>
              <div className="text-2xl font-bold">
                {indicadoresProdutos.maisVendido.quantidade_total} un
              </div>
              <p className="text-xs text-muted-foreground">
                {indicadoresProdutos.maisVendido.produtos?.nome}
              </p>
            </>
          ) : (
            <div className="py-2 text-muted-foreground text-sm">Sem dados disponíveis</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
