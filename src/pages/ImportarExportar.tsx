
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Import, Download, Upload, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ImportarExportar() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if the file is xlsx or csv
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'csv') {
        toast.error('Formato de arquivo inválido. Por favor, selecione um arquivo .xlsx ou .csv');
        event.target.value = '';
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo para importar.');
      return;
    }

    // Simulate upload process
    setIsUploading(true);
    
    // In a real implementation, here we would use FormData and upload to server
    setTimeout(() => {
      toast.success('Arquivo importado com sucesso!');
      setIsUploading(false);
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }, 1500);
  };

  const handleExport = (type: string) => {
    toast.success(`Exportando ${type}. O download começará em breve.`);
    // In a real implementation, this would trigger a server-side export process
  };

  return (
    <>
      <PageHeader 
        title="Importar/Exportar" 
        description="Importe e exporte dados do sistema"
      />
      
      <Tabs defaultValue="import">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Importar Dados</CardTitle>
              <CardDescription>
                Importe planilhas no formato "Ficha Técnica - CS JUN24" para preencher seu banco de dados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="fileInput" className="block mb-2">
                    Selecionar arquivo (.xlsx ou .csv)
                  </Label>
                  <Input
                    id="fileInput"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm">
                      Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span>
                    </p>
                  )}
                </div>
                
                <div className="border rounded-md p-4 bg-muted/20">
                  <h3 className="font-medium mb-2">Instruções</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>O arquivo deve estar no formato xlsx ou csv</li>
                    <li>Utilize o modelo "Ficha Técnica - CS JUN24"</li>
                    <li>A primeira linha deve conter os cabeçalhos</li>
                    <li>Campos obrigatórios: Nome, Categoria, Rendimento</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleImport}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>Importando...</>
                  ) : (
                    <>
                      <Import className="mr-2 h-4 w-4" />
                      Iniciar Importação
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fichas Técnicas
                </CardTitle>
                <CardDescription>Exportar todas as fichas técnicas em formato excel</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport('fichas_tecnicas')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Engenharia de Cardápio
                </CardTitle>
                <CardDescription>Exportar análise de engenharia de cardápio</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport('engenharia')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatório PDF
                </CardTitle>
                <CardDescription>Exportar relatório completo em formato PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport('relatorio_pdf')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Backup Completo
                </CardTitle>
                <CardDescription>Exportar backup completo de todos os dados</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport('backup')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Backup
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
