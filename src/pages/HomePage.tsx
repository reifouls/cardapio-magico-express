
import React from "react";
import { DashboardStats } from "@/components/dashboard/dashboard-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ProductIndicators } from "@/components/dashboard/product-indicators";
import { DashboardRecentItems } from "@/components/dashboard/dashboard-recent-items";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function HomePage() {
  const { data: statsData = { 
    totalProdutos: 0,
    totalIngredientes: 0,
    mediaMargemProdutos: 0,
    totalCombos: 0,
    totalVendas: 0,
    receitaTotal: 0
  }, isLoading: statsLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo ao Cardápio Mágico Express. Gerencie suas fichas técnicas e otimize sua precificação.
      </p>

      <DashboardStats {...statsData} />
      
      <DashboardRecentItems />
      
      <DashboardCharts />
      
      <ProductIndicators />
    </div>
  );
}
