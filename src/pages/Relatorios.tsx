
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

// This is a placeholder for the Relatórios page
// In a real implementation, this would be connected to report generation functionality

export default function Relatorios() {
  const reportTypes = [
    {
      id: 'produtos',
      title: 'Relatório de Produtos',
      description: 'Lista completa de produtos com custos, preços e margens',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'engenharia',
      title: 'Engenharia de Cardápio',
      description: 'Análise detalhada da engenharia de cardápio com classificações',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'insumos',
      title: 'Relatório de Insumos',
      description: 'Lista de insumos e análise de custos',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'financeiro',
      title: 'Relatório Financeiro',
      description: 'Análise financeira com projeções baseadas nos custos e preços',
      icon: <FileText className="h-6 w-6" />
    }
  ];

  const handleGenerateReport = (reportId: string) => {
    alert(`Gerando relatório: ${reportId}. Esta funcionalidade será implementada em breve.`);
  };

  return (
    <>
      <PageHeader 
        title="Relatórios" 
        description="Gere relatórios e análises sobre os dados do sistema"
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {report.icon}
                <CardTitle>{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">{report.description}</p>
              <Button 
                onClick={() => handleGenerateReport(report.id)}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
