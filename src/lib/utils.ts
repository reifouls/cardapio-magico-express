
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Funções úteis para formatação de moeda
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}

// Função para arredondar preços de acordo com as regras
export function arredondarPreco(preco: number, regra: string): number {
  if (!preco) return 0;
  
  switch (regra) {
    case 'Centavos 90':
      return Math.floor(preco) + 0.90;
    case 'Inteiro':
      return Math.round(preco);
    case 'Meio':
      return Math.floor(preco) + (preco % 1 >= 0.5 ? 0.5 : 0);
    default:
      return preco;
  }
}

// Função para calcular margem
export function calcularMargem(preco: number, custo: number): number {
  if (!preco || !custo || preco === 0) return 0;
  return (preco - custo) / preco;
}

// Função para formatar percentuais
export function formatarPercentual(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "0%";
  return new Intl.NumberFormat('pt-BR', { 
    style: 'percent', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}
