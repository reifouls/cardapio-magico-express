export function calcularMarkupLoja(
    percentualCustosFixos: number,
    percentualImpostos: number,
    margemLucro: number
  ): number {
    const soma = percentualCustosFixos + percentualImpostos + margemLucro;
    if (soma >= 1) return Infinity; // Prevent division by zero or negative markup
    return 1 / (1 - soma);
  }
  
  export interface MarkupDeliveryParams {
    percentualCustosFixosDelivery: number;
    percentualImpostos: number;
    taxaMarketplace: number;
    custoEmbalagemPercentual: number;
    outrosCustosPercentual: number;
    margemLucro: number;
  }
  
  export function calcularMarkupDelivery(params: MarkupDeliveryParams): number {
    const {
      percentualCustosFixosDelivery,
      percentualImpostos,
      taxaMarketplace,
      custoEmbalagemPercentual,
      outrosCustosPercentual,
      margemLucro,
    } = params;
  
    const soma =
      percentualCustosFixosDelivery +
      percentualImpostos +
      taxaMarketplace +
      custoEmbalagemPercentual +
      outrosCustosPercentual +
      margemLucro;
  
    if (soma >= 1) return Infinity;
    return 1 / (1 - soma);
  }