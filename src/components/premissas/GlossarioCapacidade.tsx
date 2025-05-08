
import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlossarioItemProps {
  termo: string;
  descricao: string;
}

const GlossarioItem = ({ termo, descricao }: GlossarioItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">
            <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{descricao}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const GlossarioCapacidade = {
  Funcionarios: () => (
    <GlossarioItem
      termo="Funcionários"
      descricao="Quantidade total de funcionários envolvidos na produção dos itens."
    />
  ),
  HorasDia: () => (
    <GlossarioItem
      termo="Horas por Dia"
      descricao="Quantidade de horas trabalhadas por dia por cada funcionário."
    />
  ),
  DiasMes: () => (
    <GlossarioItem
      termo="Dias por Mês"
      descricao="Quantidade de dias trabalhados por mês."
    />
  ),
  Produtividade: () => (
    <GlossarioItem
      termo="Produtividade"
      descricao="Percentual de tempo efetivamente utilizado para produção (entre 0 e 1). Ex: 0,75 significa 75% do tempo disponível."
    />
  ),
};
