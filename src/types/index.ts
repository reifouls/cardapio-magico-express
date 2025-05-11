export interface Categoria {
  id: string;
  nome: string;
  created_at: string;
}

export interface Ingrediente {
  id: string;
  nome: string;
  unidade: string;
  custo_unitario: number;
  tipo: string;
  fornecedor: string | null;
  created_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria_id: string | null;
  tipo: string | null;
  custo_total_receita: number | null;
  rendimento: number;
  custo_por_porcao: number | null;
  preco_definido: number | null;
  preco_sugerido: number | null;
  margem: number | null;
  id_ordenacao: number | null;
  created_at: string;
  updated_at: string;
}

export interface FichaTecnica {
  id: string;
  produto_id: string;
  ingrediente_id: string;
  quantidade_utilizada: number;
  created_at: string;
  ingrediente?: Ingrediente;
}

export interface Combo {
  id: string;
  nome: string;
  preco_total: number;
  custo_total: number | null;
  margem_combo: number | null;
  created_at: string;
  produtos?: ComboProduto[];
}

export interface ComboProduto {
  id: string;
  combo_id: string;
  produto_id: string;
  quantidade: number;
  created_at: string;
  produto?: Produto;
}

export interface Venda {
  id: string;
  produto_id: string | null;
  data_venda: string;
  quantidade: number;
  preco_aplicado: number;
  created_at: string;
  produto?: Produto;
}

export interface Popularidade {
  id: string;
  produto_id: string;
  nivel: number;
  origem_manual: boolean | null;
  created_at: string;
  produto?: Produto;
}

export interface Sugestao {
  id: string;
  tipo: string;
  produto_id: string | null;
  descricao: string;
  status: string | null;
  created_at: string;
  produto?: Produto;
}

export interface PremissaPreco {
  id: string;
  markup_desejado: number;
  regra_arredondamento: string;
  preco_minimo: number | null;
  preco_maximo: number | null;
  created_at: string;
}

export interface RegraArredondamento {
  id: string;
  nome: string;
  descricao: string;
  logica: string;
  created_at: string;
}

export interface PremissaDespesaFixa {
  id: string;
  tipo: string;
  nome_despesa: string;
  valor: number;
  created_at: string;
}

export interface PremissaCapacidadeProdutiva {
  id: string;
  funcionarios: number;
  horas_dia: number;
  dias_mes: number;
  produtividade: number;
  created_at: string;
}

export interface PremissaCustoHora {
  id: string;
  custo_total_pessoal: number;
  horas_produtivas: number;
  custo_hora: number;
  created_at: string;
}

export interface PremissaMarkup {
  id: string;
  percentual_custos_fixos: number;
  percentual_impostos: number;
  percentual_delivery: number;
  markup_loja: number;
  markup_delivery: number;
  markup_ponderado: number;
  mix_vendas_loja: number;
  mix_vendas_delivery: number;
  rateio_custos_fixos_criterio: string;
  rateio_custos_fixos_percentual: number;
  taxa_marketplace: number;
  custo_embalagem_percentual: number;
  outros_custos_delivery_percentual: number;
  margem_lucro_desejada: number;
  faturamento_desejado: number;
  created_at: string;
}
