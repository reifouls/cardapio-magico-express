export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      combo_produtos: {
        Row: {
          combo_id: string
          created_at: string
          id: string
          produto_id: string
          quantidade: number
        }
        Insert: {
          combo_id: string
          created_at?: string
          id?: string
          produto_id: string
          quantidade?: number
        }
        Update: {
          combo_id?: string
          created_at?: string
          id?: string
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_produtos_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      combos: {
        Row: {
          created_at: string
          custo_total: number | null
          id: string
          margem_combo: number | null
          nome: string
          preco_total: number
        }
        Insert: {
          created_at?: string
          custo_total?: number | null
          id?: string
          margem_combo?: number | null
          nome: string
          preco_total: number
        }
        Update: {
          created_at?: string
          custo_total?: number | null
          id?: string
          margem_combo?: number | null
          nome?: string
          preco_total?: number
        }
        Relationships: []
      }
      ficha_tecnica: {
        Row: {
          created_at: string
          id: string
          ingrediente_id: string
          produto_id: string
          quantidade_utilizada: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingrediente_id: string
          produto_id: string
          quantidade_utilizada: number
        }
        Update: {
          created_at?: string
          id?: string
          ingrediente_id?: string
          produto_id?: string
          quantidade_utilizada?: number
        }
        Relationships: [
          {
            foreignKeyName: "ficha_tecnica_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ficha_tecnica_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes: {
        Row: {
          created_at: string
          custo_unitario: number
          fornecedor: string | null
          id: string
          nome: string
          tipo: string
          unidade: string
        }
        Insert: {
          created_at?: string
          custo_unitario: number
          fornecedor?: string | null
          id?: string
          nome: string
          tipo: string
          unidade: string
        }
        Update: {
          created_at?: string
          custo_unitario?: number
          fornecedor?: string | null
          id?: string
          nome?: string
          tipo?: string
          unidade?: string
        }
        Relationships: []
      }
      popularidade: {
        Row: {
          created_at: string
          id: string
          nivel: number
          origem_manual: boolean | null
          produto_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nivel: number
          origem_manual?: boolean | null
          produto_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nivel?: number
          origem_manual?: boolean | null
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popularidade_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      premissas_capacidade_produtiva: {
        Row: {
          created_at: string
          dias_mes: number
          funcionarios: number
          horas_dia: number
          id: string
          produtividade: number
        }
        Insert: {
          created_at?: string
          dias_mes: number
          funcionarios: number
          horas_dia: number
          id?: string
          produtividade: number
        }
        Update: {
          created_at?: string
          dias_mes?: number
          funcionarios?: number
          horas_dia?: number
          id?: string
          produtividade?: number
        }
        Relationships: []
      }
      premissas_custo_hora: {
        Row: {
          created_at: string
          custo_hora: number
          custo_total_pessoal: number
          horas_produtivas: number
          id: string
        }
        Insert: {
          created_at?: string
          custo_hora: number
          custo_total_pessoal: number
          horas_produtivas: number
          id?: string
        }
        Update: {
          created_at?: string
          custo_hora?: number
          custo_total_pessoal?: number
          horas_produtivas?: number
          id?: string
        }
        Relationships: []
      }
      premissas_despesas_fixas: {
        Row: {
          created_at: string
          id: string
          nome_despesa: string
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome_despesa: string
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          nome_despesa?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      premissas_markup: {
        Row: {
          created_at: string
          custo_embalagem_percentual: number | null
          faturamento_desejado: number | null
          id: string
          margem_lucro_desejada: number | null
          markup_delivery: number
          markup_loja: number
          markup_ponderado: number
          mix_vendas_delivery: number | null
          mix_vendas_loja: number | null
          outros_custos_delivery_percentual: number | null
          percentual_custos_fixos: number
          percentual_delivery: number
          percentual_impostos: number
          rateio_custos_fixos_criterio: string | null
          rateio_custos_fixos_percentual: number | null
          taxa_marketplace: number | null
        }
        Insert: {
          created_at?: string
          custo_embalagem_percentual?: number | null
          faturamento_desejado?: number | null
          id?: string
          margem_lucro_desejada?: number | null
          markup_delivery: number
          markup_loja: number
          markup_ponderado: number
          mix_vendas_delivery?: number | null
          mix_vendas_loja?: number | null
          outros_custos_delivery_percentual?: number | null
          percentual_custos_fixos: number
          percentual_delivery: number
          percentual_impostos: number
          rateio_custos_fixos_criterio?: string | null
          rateio_custos_fixos_percentual?: number | null
          taxa_marketplace?: number | null
        }
        Update: {
          created_at?: string
          custo_embalagem_percentual?: number | null
          faturamento_desejado?: number | null
          id?: string
          margem_lucro_desejada?: number | null
          markup_delivery?: number
          markup_loja?: number
          markup_ponderado?: number
          mix_vendas_delivery?: number | null
          mix_vendas_loja?: number | null
          outros_custos_delivery_percentual?: number | null
          percentual_custos_fixos?: number
          percentual_delivery?: number
          percentual_impostos?: number
          rateio_custos_fixos_criterio?: string | null
          rateio_custos_fixos_percentual?: number | null
          taxa_marketplace?: number | null
        }
        Relationships: []
      }
      premissas_preco: {
        Row: {
          created_at: string
          id: string
          markup_desejado: number
          preco_maximo: number | null
          preco_minimo: number | null
          regra_arredondamento: string
        }
        Insert: {
          created_at?: string
          id?: string
          markup_desejado: number
          preco_maximo?: number | null
          preco_minimo?: number | null
          regra_arredondamento: string
        }
        Update: {
          created_at?: string
          id?: string
          markup_desejado?: number
          preco_maximo?: number | null
          preco_minimo?: number | null
          regra_arredondamento?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria_id: string | null
          created_at: string
          custo_por_porcao: number | null
          custo_total_receita: number | null
          id: string
          id_ordenacao: number | null
          margem: number | null
          nome: string
          preco_definido: number | null
          preco_sugerido: number | null
          rendimento: number
          tipo: string | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          custo_por_porcao?: number | null
          custo_total_receita?: number | null
          id?: string
          id_ordenacao?: number | null
          margem?: number | null
          nome: string
          preco_definido?: number | null
          preco_sugerido?: number | null
          rendimento: number
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          custo_por_porcao?: number | null
          custo_total_receita?: number | null
          id?: string
          id_ordenacao?: number | null
          margem?: number | null
          nome?: string
          preco_definido?: number | null
          preco_sugerido?: number | null
          rendimento?: number
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_arredondamento: {
        Row: {
          created_at: string
          descricao: string
          id: string
          logica: string
          nome: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          logica: string
          nome: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          logica?: string
          nome?: string
        }
        Relationships: []
      }
      sugestoes: {
        Row: {
          created_at: string
          descricao: string
          id: string
          produto_id: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          produto_id?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          produto_id?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sugestoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          created_at: string
          data_venda: string
          id: string
          preco_aplicado: number
          produto_id: string | null
          quantidade: number
        }
        Insert: {
          created_at?: string
          data_venda?: string
          id?: string
          preco_aplicado: number
          produto_id?: string | null
          quantidade: number
        }
        Update: {
          created_at?: string
          data_venda?: string
          id?: string
          preco_aplicado?: number
          produto_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
