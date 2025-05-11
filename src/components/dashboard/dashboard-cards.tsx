
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, ShoppingBasket, Package, LineChart, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatarPercentual } from "@/lib/utils";
import { DashboardStatsProps } from './dashboard-stats-types';

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export function DashboardCard({ title, value, description, icon, href }: DashboardCardProps) {
  return (
    <Link to={href}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardStats(props: DashboardStatsProps) {
  const {
    totalProdutos,
    totalIngredientes,
    mediaMargemProdutos,
    totalCombos,
    totalVendas,
    receitaTotal
  } = props;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DashboardCard
        title="Produtos"
        value={totalProdutos.toString()}
        description="Total de produtos cadastrados"
        icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
        href="/fichas-tecnicas"
      />
      <DashboardCard
        title="Ingredientes"
        value={totalIngredientes.toString()}
        description="Total de ingredientes cadastrados"
        icon={<ShoppingBasket className="h-4 w-4 text-muted-foreground" />}
        href="/ingredientes"
      />
      <DashboardCard
        title="Margem Média"
        value={formatarPercentual(mediaMargemProdutos)}
        description="Média de margem dos produtos"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        href="/engenharia"
      />
      <DashboardCard
        title="Combos"
        value={totalCombos.toString()}
        description="Total de combos cadastrados"
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        href="/combos"
      />
      <DashboardCard
        title="Vendas"
        value={totalVendas.toString()}
        description="Total de vendas registradas"
        icon={<LineChart className="h-4 w-4 text-muted-foreground" />}
        href="/relatorios"
      />
      <DashboardCard
        title="Receita"
        value={formatCurrency(receitaTotal)}
        description="Receita total das vendas"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        href="/relatorios"
      />
    </div>
  );
}
