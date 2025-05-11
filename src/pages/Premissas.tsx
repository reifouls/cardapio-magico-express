
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CapacidadeProdutivaForm from '@/components/premissas/CapacidadeProdutiva';
import DespesasFixasForm from '@/components/premissas/DespesasFixasForm';
import MarkupForm from '@/components/premissas/MarkupForm';
import MarkupDeliveryForm from '@/components/premissas/MarkupDeliveryForm';

export default function Premissas() {
  const [activeTab, setActiveTab] = useState('capacidade');

  return (
    <>
      <PageHeader 
        title="Premissas" 
        description="Configure as premissas para cálculos do sistema"
      />
      
      <Tabs 
        defaultValue="capacidade" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacidade">Capacidade Produtiva</TabsTrigger>
          <TabsTrigger value="despesas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="markup">Markup</TabsTrigger>
          <TabsTrigger value="markup-delivery">Markup Delivery</TabsTrigger>
        </TabsList>
        
        {/* Tab de Capacidade Produtiva */}
        <TabsContent value="capacidade">
          <Card>
            <CardContent className="pt-6">
              <CapacidadeProdutivaForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Despesas Fixas */}
        <TabsContent value="despesas">
          <Card>
            <CardContent className="pt-6">
              <DespesasFixasForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Markup */}
        <TabsContent value="markup">
          <Card>
            <CardContent className="pt-6">
              <MarkupForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Markup Delivery */}
        <TabsContent value="markup-delivery">
          <Card>
            <CardContent className="pt-6">
              <MarkupDeliveryForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
