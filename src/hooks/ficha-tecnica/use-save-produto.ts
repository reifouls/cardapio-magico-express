
import { useSupabaseMutation } from '@/hooks/use-supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { ProdutoWithFichaTecnica, IngredienteQuantidade } from '@/types/ficha-tecnica.types';

interface UseSaveProdutoProps {
  currentProduto: Partial<ProdutoWithFichaTecnica> | null;
  ingredientes: IngredienteQuantidade[];
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
  };
}

export function useSaveProduto({
  currentProduto,
  ingredientes,
  options
}: UseSaveProdutoProps) {
  const queryClient = useQueryClient();

  // Mutations for produto and ficha_tecnica tables
  const { 
    insert: insertProduto, 
    update: updateProduto 
  } = useSupabaseMutation<'produtos'>(
    'produtos',
    {
      onSuccessMessage: options?.onSuccessMessage || 'Produto salvo com sucesso!',
      onErrorMessage: options?.onErrorMessage || 'Erro ao salvar produto',
      queryKeyToInvalidate: ['produtos', 'list']
    }
  );

  const { 
    insert: insertFichaTecnica, 
    remove: removeFichaTecnica 
  } = useSupabaseMutation<'ficha_tecnica'>(
    'ficha_tecnica',
    {
      queryKeyToInvalidate: ['produtos', 'list', 'ficha_tecnica']
    }
  );

  const handleSaveProduto = async () => {
    if (!currentProduto?.nome || !currentProduto.rendimento) return false;
    try {
      let produtoId = currentProduto.id;
      // Insert or update produto
      if (!produtoId) {
        const produtoToInsert = {
          nome: currentProduto.nome,
          rendimento: currentProduto.rendimento,
          tipo: currentProduto.tipo || 'Produto',
          categoria_id: currentProduto.categoria_id,
          custo_total_receita: currentProduto.custo_total_receita,
          custo_por_porcao: currentProduto.custo_por_porcao,
          preco_definido:
            typeof currentProduto.preco_definido === 'string'
              ? (currentProduto.preco_definido as string).trim() === '' ? null : parseFloat(currentProduto.preco_definido as string)
              : currentProduto.preco_definido ?? null,
          preco_sugerido: currentProduto.preco_sugerido,
          margem: currentProduto.margem
        };
        console.log('Produto a ser inserido:', produtoToInsert);
        let newProduto;
        try {
          newProduto = await insertProduto(produtoToInsert);
        } catch (err) {
          toast.error({
            title: "Erro ao inserir produto",
            description: (err?.message || JSON.stringify(err))
          });
          console.error('Erro real do Supabase ao inserir produto:', err);
          throw err;
        }
        produtoId = newProduto?.[0]?.id;
        if (!produtoId) throw new Error('Erro ao inserir produto');
      } else {
        await updateProduto({
          id: produtoId,
          data: {
            ...currentProduto,
            preco_definido:
              typeof currentProduto.preco_definido === 'string'
                ? (currentProduto.preco_definido as string).trim() === '' ? null : parseFloat(currentProduto.preco_definido as string)
                : currentProduto.preco_definido ?? null
          }
        });
        
        // First remove all existing ingredients for this product
        console.log('Removing existing ingredients for produto:', produtoId);
        try {
          // Important: AWAIT here to ensure deletion completes before insertion
          await removeFichaTecnica('produto_id', produtoId);
          
          // Small delay to ensure deletion completes in DB
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('Successfully removed existing ingredients for produto:', produtoId);
        } catch (err) {
          toast.error({
            title: "Erro ao remover ingredientes existentes",
            description: (err?.message || JSON.stringify(err))
          });
          console.error('Erro ao remover ingredientes existentes:', err);
          throw err;
        }
      }
      
      // Filtrar ingredientes duplicados
      const ingredientesMap = new Map();
      ingredientes.forEach(item => {
        if (item.quantidade > 0) {
          ingredientesMap.set(item.id, item);
        }
      });
      const ingredientesUnicos = Array.from(ingredientesMap.values());
      
      console.log('Ingredientes únicos a serem inseridos:', ingredientesUnicos);
      
      // Insert ficha_tecnica
      if (produtoId) {
        console.log('ProdutoId para inserir ingredientes:', produtoId);
        // Insert cada ingrediente individualmente para melhor controle de erros
        for (const ingrediente of ingredientesUnicos) {
          if (ingrediente.quantidade > 0) {
            try {
              await insertFichaTecnica({
                produto_id: produtoId,
                ingrediente_id: ingrediente.id,
                quantidade_utilizada: ingrediente.quantidade
              });
            } catch (err) {
              console.error('Erro ao inserir ingrediente na ficha técnica:', err);
              toast.error({
                title: "Erro ao inserir ingrediente",
                description: `Ingrediente: ${ingrediente.id} - ${err?.message || JSON.stringify(err)}`
              });
              // Continue trying to insert other ingredients
            }
          }
        }
      }
      
      toast.success({
        title: "Sucesso",
        description: "Ficha técnica salva com sucesso!"
      });
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['produtos', 'list'] });
      await queryClient.invalidateQueries({ queryKey: ['ficha_tecnica', 'by-produto', produtoId || ''] });
      
      return true;
    } catch (error: any) {
      toast.error({
        title: "Erro ao salvar",
        description: `Erro: ${error?.message || JSON.stringify(error)}`
      });
      console.error('Erro ao salvar produto/ficha técnica:', error);
      return false;
    }
  };

  return {
    handleSaveProduto
  };
}
