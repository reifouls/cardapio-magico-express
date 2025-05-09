
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatarPercentual } from "@/lib/utils";
import { X, Plus, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetFooter } from '@/components/ui/sheet';
import { useSupabaseQuery } from '@/hooks/use-supabase';
import { Database } from '@/integrations/supabase/types';

type Produto = Database['public']['Tables']['produtos']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Ingrediente = Database['public']['Tables']['ingredientes']['Row'];
type FichaTecnica = Database['public']['Tables']['ficha_tecnica']['Row'];

interface FichaTecnicaFormProps {
  currentProduto: Partial<Produto> | null;
  setCurrentProduto: React.Dispatch<React.SetStateAction<Partial<Produto> | null>>;
  ingredientes: {id: string, quantidade: number}[];
  setIngredientes: React.Dispatch<React.SetStateAction<{id: string, quantidade: number}[]>>;
  onSave: () => Promise<void>;
}

export default function FichaTecnicaForm({
  currentProduto,
  setCurrentProduto,
  ingredientes,
  setIngredientes,
  onSave
}: FichaTecnicaFormProps) {
  const [custoTotal, setCustoTotal] = useState(0);
  const [custoPorPorcao, setCustoPorPorcao] = useState(0);
  const [precoSugeridoLoja, setPrecoSugeridoLoja] = useState(0);
  const [precoSugeridoDelivery, setPrecoSugeridoDelivery] = useState(0);
  
  // Buscar categorias
  const { data: categoriasList } = useSupabaseQuery<
    'categorias',
    false,
    Categoria[]
  >(
    'categorias',
    ['list'],
    { order: 'nome' }
  );

  // Buscar ingredientes
  const { data: ingredientesList } = useSupabaseQuery<
    'ingredientes',
    false,
    Ingrediente[]
  >(
    'ingredientes',
    ['list'],
    { order: 'nome' }
  );

  // Buscar markup para cálculos
  const { data: markup } = useSupabaseQuery(
    'premissas_markup',
    ['markup'],
    { single: true }
  );

  // Calcular custos quando ingredientes ou rendimento mudam
  useEffect(() => {
    if (ingredientesList && ingredientes.length > 0) {
      let total = 0;
      
      // Calcular o custo total
      ingredientes.forEach(item => {
        const ingrediente = ingredientesList.find(i => i.id === item.id);
        if (ingrediente) {
          total += ingrediente.custo_unitario * item.quantidade;
        }
      });
      
      setCustoTotal(total);
      
      // Calcular custo por porção
      const rendimento = currentProduto?.rendimento || 1;
      const porPorcao = total / rendimento;
      setCustoPorPorcao(porPorcao);
      
      // Calcular preços sugeridos
      if (markup) {
        setPrecoSugeridoLoja(porPorcao * markup.markup_loja);
        setPrecoSugeridoDelivery(porPorcao * markup.markup_delivery);
      }
      
      // Atualizar o produto atual com os custos calculados
      setCurrentProduto(prev => ({
        ...prev,
        custo_total_receita: total,
        custo_por_porcao: porPorcao,
        preco_sugerido: porPorcao * (markup?.markup_loja || 2),
        margem: prev?.preco_definido 
          ? (prev.preco_definido - porPorcao) / prev.preco_definido
          : ((porPorcao * (markup?.markup_loja || 2)) - porPorcao) / (porPorcao * (markup?.markup_loja || 2))
      }));
    } else {
      setCustoTotal(0);
      setCustoPorPorcao(0);
      setPrecoSugeridoLoja(0);
      setPrecoSugeridoDelivery(0);
    }
  }, [ingredientes, ingredientesList, currentProduto?.rendimento, markup]);

  // Atualizar o preço sugerido quando o preço definido mudar
  useEffect(() => {
    if (currentProduto?.preco_definido !== undefined) {
      setCurrentProduto(prev => ({
        ...prev,
        margem: prev?.preco_definido && custoPorPorcao
          ? (prev.preco_definido - custoPorPorcao) / prev.preco_definido
          : prev?.margem
      }));
    }
  }, [currentProduto?.preco_definido, custoPorPorcao]);

  const handleAddIngrediente = () => {
    if (ingredientesList && ingredientesList.length > 0) {
      setIngredientes([...ingredientes, { id: ingredientesList[0].id, quantidade: 0 }]);
    }
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-6 py-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Produto</Label>
          <Input
            id="nome"
            value={currentProduto?.nome || ''}
            onChange={(e) => setCurrentProduto({...currentProduto!, nome: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Select 
            value={currentProduto?.categoria_id || ''} 
            onValueChange={(value) => setCurrentProduto({...currentProduto!, categoria_id: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoriasList?.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rendimento">Rendimento (porções)</Label>
          <Input
            id="rendimento"
            type="number"
            min="1"
            value={currentProduto?.rendimento || 1}
            onChange={(e) => setCurrentProduto(
              {...currentProduto!, rendimento: parseInt(e.target.value) || 1}
            )}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="preco">Preço de Venda (opcional)</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            value={currentProduto?.preco_definido || ''}
            onChange={(e) => setCurrentProduto(
              {...currentProduto!, preco_definido: parseFloat(e.target.value) || undefined}
            )}
          />
          <p className="text-xs text-muted-foreground">
            Se vazio, o preço sugerido será utilizado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Custo Total da Receita</Label>
          <Input
            type="text"
            value={formatCurrency(custoTotal)}
            readOnly
            className="bg-gray-50"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Custo por Porção</Label>
          <Input
            type="text"
            value={formatCurrency(custoPorPorcao)}
            readOnly
            className="bg-gray-50"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Preço Sugerido Loja</Label>
          <Input
            type="text"
            value={formatCurrency(precoSugeridoLoja)}
            readOnly
            className="bg-gray-50"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Preço Sugerido Delivery</Label>
          <Input
            type="text"
            value={formatCurrency(precoSugeridoDelivery)}
            readOnly
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label>Margem Estimada</Label>
          <Input
            type="text"
            value={formatarPercentual(
              currentProduto?.preco_definido 
                ? (currentProduto.preco_definido - custoPorPorcao) / currentProduto.preco_definido 
                : (precoSugeridoLoja - custoPorPorcao) / precoSugeridoLoja
            )}
            readOnly
            className="bg-gray-50"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Ingredientes</h3>
          <Button type="button" onClick={handleAddIngrediente} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Ingrediente
          </Button>
        </div>

        {ingredientes.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum ingrediente adicionado.</p>
        )}

        {ingredientes.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Select 
                value={item.id} 
                onValueChange={(value) => {
                  const newIngredientes = [...ingredientes];
                  newIngredientes[index].id = value;
                  setIngredientes(newIngredientes);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ingredientesList?.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.nome} ({ing.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Input
                type="number"
                step="0.01"
                value={item.quantidade}
                onChange={(e) => {
                  const newIngredientes = [...ingredientes];
                  newIngredientes[index].quantidade = parseFloat(e.target.value) || 0;
                  setIngredientes(newIngredientes);
                }}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveIngrediente(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <SheetFooter>
        <Button onClick={onSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Salvar Ficha Técnica
        </Button>
      </SheetFooter>
    </div>
  );
}
