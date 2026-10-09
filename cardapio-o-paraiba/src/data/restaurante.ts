/**
 * Dados do estabelecimento. Fonte: matéria "O Paraíba soma três décadas servindo
 * comida regional em Fortaleza" (Sabores da Cidade, 10/09/2026) e o perfil
 * @restauranteoparaiba. Confirme com o restaurante antes de publicar.
 */

/** 0 = domingo … 6 = sábado. Horários em hora local de Fortaleza (UTC−3, sem horário de verão). */
export type Expediente = { dia: number; abre: string; fecha: string };

export const restaurante = {
  nome: 'O Paraíba',
  nomeCompleto: 'Restaurante O Paraíba',
  slogan: 'Comida regional temperada na hora',
  desde: 1994,
  donos: 'Sebastião da Costa e Maria do Socorro',
  endereco: {
    rua: 'Rua Tenente Barbosa, 128',
    bairro: 'Alto da Balança',
    cidade: 'Fortaleza – CE',
    cep: '60851-490',
  },
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Rua+Tenente+Barbosa%2C+128+-+Alto+da+Balan%C3%A7a%2C+Fortaleza+-+CE',
  instagram: { usuario: 'restauranteoparaiba', url: 'https://www.instagram.com/restauranteoparaiba/' },
  /**
   * WhatsApp que recebe os pedidos: DDI + DDD + número, só dígitos.
   * ATENÇÃO: (85) 98705-4152 é o número de TESTE — troque pelo da casa antes de publicar.
   */
  whatsapp: '5585987054152',
  /** Formas de pedido oferecidas no carrinho. Tire 'entrega' se a casa não entregar. */
  modalidades: ['salao', 'retirada', 'entrega'] as const,
  timeZone: 'America/Fortaleza',
  expediente: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: '08:00', fecha: '15:00' })) as Expediente[],
  historia: [
    'Sebastião chegou de Esperança, na Paraíba, com uns 18 anos. Vendeu rede na beira da BR-116, em frente a uma churrascaria, até o dono chamá-lo para lavar copos lá dentro.',
    'Em 1994 abriu a própria casa no Alto da Balança. Desde então, ele e Maria do Socorro temperam cada panela: só tempero natural, nada carregado, tudo cortado na hora.',
  ],
  citacao: { texto: 'Só gente fina.', contexto: 'Sebastião, sobre a freguesia da casa' },
} as const;

/**
 * Quando `true`, itens com `verificado: false` exibem "preço a confirmar".
 * Desligue depois que o restaurante validar o cardápio.
 */
export const MODO_PREVIA = true;
