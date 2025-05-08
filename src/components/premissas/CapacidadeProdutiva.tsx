
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase';
import { GlossarioCapacidade } from './GlossarioCapacidade';

type CapacidadeProdutiva = {
  id: string;
  funcionarios: number;
  horas_dia: number;
  dias_mes: number;
  produtividade: number;
};

export default function CapacidadeProdutivaForm() {
  const { data: capacidadeProdutiva, isLoading } = useSupabaseQuery<
    'premissas_capacidade_produtiva',
    true,
    CapacidadeProdutiva | null
  >(
    'premissas_capacidade_produtiva',
    ['capacidade'],
    { single: true }
  );

  const [capacidadeForm, setCapacidadeForm] = useState<Partial<CapacidadeProdutiva>>({
    funcionarios: 0,
    horas_dia: 8,
    dias_mes: 22,
    produtividade: 0.75
  });

  useEffect(() => {
    if (capacidadeProdutiva) {
      setCapacidadeForm(capacidadeProdutiva);
    }
  }, [capacidadeProdutiva]);

  const { update: updateCapacidade, insert: insertCapacidade } = useSupabaseMutation<'premissas_capacidade_produtiva'>(
    'premissas_capacidade_produtiva',
    {
      onSuccessMessage: 'Capacidade produtiva salva com sucesso!',
      queryKeyToInvalidate: ['capacidade']
    }
  );

  const handleSaveCapacidade = async () => {
    if (capacidadeProdutiva?.id) {
      await updateCapacidade({
        id: capacidadeProdutiva.id,
        data: {
          funcionarios: capacidadeForm.funcionarios || 0,
          horas_dia: capacidadeForm.horas_dia || 0,
          dias_mes: capacidadeForm.dias_mes || 0,
          produtividade: capacidadeForm.produtividade || 0
        }
      });
    } else {
      await insertCapacidade({
        funcionarios: capacidadeForm.funcionarios || 0,
        horas_dia: capacidadeForm.horas_dia || 0,
        dias_mes: capacidadeForm.dias_mes || 0,
        produtividade: capacidadeForm.produtividade || 0
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="funcionarios">Número de Funcionários</Label>
          <GlossarioCapacidade.Funcionarios />
        </div>
        <Input
          id="funcionarios"
          type="number"
          min="1"
          value={capacidadeForm.funcionarios || ''}
          onChange={(e) => setCapacidadeForm({
            ...capacidadeForm,
            funcionarios: parseInt(e.target.value) || 0
          })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="horas_dia">Horas por Dia</Label>
          <GlossarioCapacidade.HorasDia />
        </div>
        <Input
          id="horas_dia"
          type="number"
          min="1"
          max="24"
          value={capacidadeForm.horas_dia || ''}
          onChange={(e) => setCapacidadeForm({
            ...capacidadeForm,
            horas_dia: parseInt(e.target.value) || 0
          })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="dias_mes">Dias por Mês</Label>
          <GlossarioCapacidade.DiasMes />
        </div>
        <Input
          id="dias_mes"
          type="number"
          min="1"
          max="31"
          value={capacidadeForm.dias_mes || ''}
          onChange={(e) => setCapacidadeForm({
            ...capacidadeForm,
            dias_mes: parseInt(e.target.value) || 0
          })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="produtividade">Produtividade</Label>
          <GlossarioCapacidade.Produtividade />
        </div>
        <Input
          id="produtividade"
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={capacidadeForm.produtividade || ''}
          onChange={(e) => setCapacidadeForm({
            ...capacidadeForm,
            produtividade: parseFloat(e.target.value) || 0
          })}
        />
        <p className="text-xs text-muted-foreground">
          Valor entre 0 e 1 (ex: 0.75 = 75%)
        </p>
      </div>
      
      <div className="col-span-2 pt-4">
        <Button onClick={handleSaveCapacidade} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Salvar Capacidade Produtiva
        </Button>
      </div>
    </div>
  );
}
