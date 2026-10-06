import type { AddonGroup, Category, Product, StoreSettings } from '@nazario/shared';

/**
 * Initial menu. Everything here is editable from /admin — this file only seeds
 * an empty database. Prices are integer cents.
 */

export const seedCategories: Category[] = [
  {
    id: 'pizzas',
    name: 'Pizzas',
    tagline: 'Massa de longa fermentação, forno a lenha',
    description: 'Fermentação natural de 48 horas, borda alta e aerada, assada a 400 °C.',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'massas',
    name: 'Massas',
    tagline: 'Feitas à mão, todos os dias',
    description: 'Massas frescas de sêmola e ovos caipiras, com molhos que levam horas no fogo.',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    tagline: 'Sempre geladas',
    description: 'Refrigerantes, águas e sucos naturais para acompanhar.',
    sortOrder: 3,
    active: true,
  },
];

export const seedAddonGroups: AddonGroup[] = [
  {
    id: 'borda',
    name: 'Borda recheada',
    description: 'Escolha até 1',
    minSelect: 0,
    maxSelect: 1,
    options: [
      { id: 'borda-catupiry', name: 'Borda de Catupiry', price: 1200, active: true },
      { id: 'borda-cheddar', name: 'Borda de cheddar', price: 1200, active: true },
      { id: 'borda-cream-cheese', name: 'Borda de cream cheese', price: 1200, active: true },
    ],
  },
  {
    id: 'extras-pizza',
    name: 'Adicionais',
    description: 'Escolha até 5',
    minSelect: 0,
    maxSelect: 5,
    options: [
      { id: 'extra-queijo', name: 'Extra mozzarella', price: 900, active: true },
      { id: 'extra-catupiry', name: 'Catupiry', price: 900, active: true },
      { id: 'extra-cheddar', name: 'Cheddar', price: 900, active: true },
      { id: 'extra-bacon', name: 'Bacon crocante', price: 1000, active: true },
      { id: 'extra-calabresa', name: 'Calabresa', price: 800, active: true },
      { id: 'extra-burrata', name: 'Burrata (125 g)', price: 1900, active: true },
      { id: 'extra-azeitonas', name: 'Azeitonas pretas', price: 500, active: true },
      { id: 'extra-rucula', name: 'Rúcula fresca', price: 600, active: true },
    ],
  },
  {
    id: 'extras-massa',
    name: 'Adicionais',
    description: 'Escolha até 4',
    minSelect: 0,
    maxSelect: 4,
    options: [
      { id: 'massa-parmesao', name: 'Parmesão extra', price: 600, active: true },
      { id: 'massa-bacon', name: 'Bacon crocante', price: 800, active: true },
      { id: 'massa-frango', name: 'Frango grelhado', price: 900, active: true },
      { id: 'massa-cogumelos', name: 'Cogumelos salteados', price: 800, active: true },
      { id: 'massa-pao-alho', name: 'Pão de alho da casa', price: 1000, active: true },
    ],
  },
];

const pizzaSizes = (p: number, m: number, g: number) => [
  { id: 'p', label: 'Pequena', detail: '25 cm · 4 fatias', price: p },
  { id: 'm', label: 'Média', detail: '30 cm · 6 fatias', price: m },
  { id: 'g', label: 'Grande', detail: '35 cm · 8 fatias', price: g },
];
const pastaSizes = (individual: number, duo: number) => [
  { id: 'individual', label: 'Individual', detail: 'Serve 1 pessoa', price: individual },
  { id: 'duo', label: 'Para dois', detail: 'Serve 2 pessoas', price: duo },
];

type Seed = Omit<Product, 'id' | 'sortOrder' | 'active' | 'badges' | 'featured' | 'addonGroupIds'> &
  Partial<Pick<Product, 'badges' | 'featured' | 'addonGroupIds'>>;

const pizzas: Seed[] = [
  {
    slug: 'especial-nazario',
    categoryId: 'pizzas',
    name: 'Especial Nazário',
    shortDescription: 'Espinafre, ricota de búfala, alho confitado e mozzarella fior di latte.',
    description:
      'A pizza que leva o nome da casa. Base branca de fior di latte, espinafre salteado no azeite, colheradas de ricota de búfala e alho confitado lentamente. Finalizada com raspas de limão-siciliano.',
    ingredients: ['Fior di latte', 'Espinafre', 'Ricota de búfala', 'Alho confitado', 'Limão-siciliano'],
    image: '/images/pizza-especial-nazario',
    imageAlt: 'Pizza com espinafre e ricota sobre massa de borda alta, vista de cima',
    variants: pizzaSizes(5900, 7900, 9900),
    badges: ['assinatura'],
    featured: true,
  },
  {
    slug: 'margherita',
    categoryId: 'pizzas',
    name: 'Margherita',
    shortDescription: 'Pomodoro San Marzano, fior di latte, manjericão e azeite extravirgem.',
    description:
      'A clássica napolitana, como deve ser: molho de tomates San Marzano, mozzarella fior di latte rasgada à mão, manjericão fresco e um fio de azeite extravirgem ao sair do forno.',
    ingredients: ['Tomate San Marzano', 'Fior di latte', 'Manjericão', 'Azeite extravirgem'],
    image: '/images/pizza-margherita',
    imageAlt: 'Pizza margherita com mozzarella derretida e folhas de manjericão',
    variants: pizzaSizes(4600, 6400, 8200),
    badges: ['vegetariano'],
    featured: true,
  },
  {
    slug: 'bufala-e-pomodoro',
    categoryId: 'pizzas',
    name: 'Búfala & Pomodoro',
    shortDescription: 'Mozzarella de búfala, pomodoro assado, manjericão e flor de sal.',
    description:
      'Mozzarella de búfala em lascas generosas sobre molho de tomate pelado, tomates assados no forno a lenha e manjericão. Flor de sal e pimenta-do-reino moída na hora.',
    ingredients: ['Mozzarella de búfala', 'Tomate assado', 'Manjericão', 'Flor de sal'],
    image: '/images/pizza-bufala',
    imageAlt: 'Pizza de mozzarella de búfala com manjericão em forma de ferro',
    variants: pizzaSizes(5400, 7400, 9400),
    badges: ['vegetariano'],
  },
  {
    slug: 'calabresa',
    categoryId: 'pizzas',
    name: 'Calabresa Artesanal',
    shortDescription: 'Calabresa defumada fatiada fina, cebola roxa e azeitonas.',
    description:
      'Calabresa defumada artesanalmente, fatiada fina para dourar no forno, sobre mozzarella e molho de tomate. Cebola roxa em pétalas e azeitonas pretas.',
    ingredients: ['Calabresa defumada', 'Mozzarella', 'Cebola roxa', 'Azeitonas pretas', 'Orégano'],
    image: '/images/pizza-calabresa',
    imageAlt: 'Pizza de calabresa com fatias douradas cobrindo a superfície',
    variants: pizzaSizes(4400, 6200, 7900),
    featured: true,
  },
  {
    slug: 'quatro-queijos',
    categoryId: 'pizzas',
    name: 'Quatro Queijos',
    shortDescription: 'Mozzarella, gorgonzola, parmesão 12 meses e provolone defumado.',
    description:
      'Equilíbrio entre cremosidade e personalidade: mozzarella, gorgonzola dolce, parmesão curado por 12 meses e provolone defumado. Finalizada com mel de laranjeira opcional — é só pedir nas observações.',
    ingredients: ['Mozzarella', 'Gorgonzola', 'Parmesão 12 meses', 'Provolone defumado'],
    image: '/images/pizza-quatro-queijos',
    imageAlt: 'Pizza de quatro queijos dourada com ervas frescas sobre tábua',
    variants: pizzaSizes(5200, 7200, 9200),
    badges: ['vegetariano'],
    featured: true,
  },
  {
    slug: 'portuguesa',
    categoryId: 'pizzas',
    name: 'Portuguesa da Casa',
    shortDescription: 'Presunto cozido, ovo caipira, cebola, azeitonas e mozzarella.',
    description:
      'Nossa releitura da portuguesa: presunto cozido artesanal, ovos caipiras assados direto sobre a massa, cebola em fatias finas, azeitonas pretas e mozzarella.',
    ingredients: ['Presunto cozido', 'Ovo caipira', 'Cebola', 'Azeitonas pretas', 'Mozzarella'],
    image: '/images/pizza-portuguesa',
    imageAlt: 'Pizza portuguesa com ovo assado no centro e azeitonas pretas',
    variants: pizzaSizes(4800, 6800, 8600),
  },
  {
    slug: 'frango-com-catupiry',
    categoryId: 'pizzas',
    name: 'Frango com Catupiry',
    shortDescription: 'Frango desfiado temperado, Catupiry original e milho tostado.',
    description:
      'Frango caipira cozido em caldo de legumes e desfiado à mão, coberto com Catupiry original, cebola roxa e milho tostado no forno.',
    ingredients: ['Frango desfiado', 'Catupiry', 'Mozzarella', 'Cebola roxa', 'Milho tostado'],
    image: '/images/pizza-frango-catupiry',
    imageAlt: 'Fatia de pizza de frango sendo levantada, com queijo derretido',
    variants: pizzaSizes(4600, 6400, 8200),
    featured: true,
  },
  {
    slug: 'pepperoni',
    categoryId: 'pizzas',
    name: 'Pepperoni',
    shortDescription: 'Pepperoni curado que encrespa no forno, mozzarella e mel picante.',
    description:
      'Fatias de pepperoni curado que se curvam e caramelizam no forno a lenha, sobre mozzarella e molho de tomate. Finalizada com um fio de mel picante da casa.',
    ingredients: ['Pepperoni', 'Mozzarella', 'Molho de tomate', 'Mel picante'],
    image: '/images/pizza-pepperoni',
    imageAlt: 'Pizza de pepperoni inteira com fatias crocantes, vista de cima',
    variants: pizzaSizes(5000, 7000, 8900),
    badges: ['picante'],
    featured: true,
  },
  {
    slug: 'bacon-e-cogumelos',
    categoryId: 'pizzas',
    name: 'Bacon & Cogumelos',
    shortDescription: 'Bacon crocante, cogumelos paris salteados, alho e tomilho.',
    description:
      'Bacon em cubos dourado até ficar crocante, cogumelos paris salteados na manteiga com alho e tomilho, sobre mozzarella e tomates frescos.',
    ingredients: ['Bacon', 'Cogumelos paris', 'Mozzarella', 'Tomate', 'Tomilho'],
    image: '/images/pizza-bacon-cogumelos',
    imageAlt: 'Fatias de pizza com cogumelos, tomates e ervas sobre superfície escura',
    variants: pizzaSizes(4900, 6900, 8800),
  },
  {
    slug: 'napolitana',
    categoryId: 'pizzas',
    name: 'Napolitana',
    shortDescription: 'Tomates frescos em rodelas, mozzarella, parmesão e azeitonas.',
    description:
      'Rodelas de tomate fresco sobre mozzarella, azeitonas verdes, parmesão ralado na hora e manjericão. Leve, perfumada e muito pedida no verão.',
    ingredients: ['Tomate fresco', 'Mozzarella', 'Parmesão', 'Azeitonas verdes', 'Manjericão'],
    image: '/images/pizza-napolitana',
    imageAlt: 'Pizza napolitana com rodelas de tomate e azeitonas',
    variants: pizzaSizes(4500, 6300, 8000),
    badges: ['vegetariano'],
  },
  {
    slug: 'presunto-e-queijo',
    categoryId: 'pizzas',
    name: 'Presunto & Queijo',
    shortDescription: 'Presunto cozido artesanal e dupla camada de mozzarella.',
    description:
      'Simples e perfeita para todas as idades: presunto cozido artesanal em fatias e camada dupla de mozzarella gratinada no forno a lenha.',
    ingredients: ['Presunto cozido', 'Mozzarella', 'Molho de tomate', 'Orégano'],
    image: '/images/pizza-presunto-queijo',
    imageAlt: 'Pizza de presunto e queijo inteira sobre tábua de madeira',
    variants: pizzaSizes(4200, 5900, 7600),
  },
  {
    slug: 'carne-seca',
    categoryId: 'pizzas',
    name: 'Carne Seca com Catupiry',
    shortDescription: 'Carne seca desfiada na manteiga de garrafa, Catupiry e cebola caramelizada.',
    description:
      'Carne seca dessalgada e desfiada, refogada na manteiga de garrafa, com Catupiry original e cebola caramelizada lentamente. Um sabor bem brasileiro com técnica italiana.',
    ingredients: ['Carne seca', 'Catupiry', 'Cebola caramelizada', 'Manteiga de garrafa', 'Mozzarella'],
    image: '/images/pizza-carne-seca',
    imageAlt: 'Pizza com carne desfiada e queijo derretido em forma redonda',
    variants: pizzaSizes(5400, 7600, 9600),
    badges: ['novidade'],
  },
  {
    slug: 'vegetariana',
    categoryId: 'pizzas',
    name: 'Horta Vegetariana',
    shortDescription: 'Abobrinha, pimentões assados, milho, azeitonas e cebola roxa.',
    description:
      'Legumes da estação assados no forno a lenha: abobrinha, pimentões vermelho e amarelo, milho, cebola roxa e azeitonas, sobre mozzarella e molho de tomate.',
    ingredients: ['Abobrinha', 'Pimentões assados', 'Milho', 'Cebola roxa', 'Azeitonas'],
    image: '/images/pizza-vegetariana',
    imageAlt: 'Pizza vegetariana colorida com pimentões e azeitonas sobre pá de madeira',
    variants: pizzaSizes(4700, 6600, 8400),
    badges: ['vegetariano'],
  },
  {
    slug: 'rucula-e-parma',
    categoryId: 'pizzas',
    name: 'Rúcula & Parma',
    shortDescription: 'Presunto de Parma, rúcula fresca, tomate e lascas de parmesão.',
    description:
      'Saída do forno com mozzarella e molho de tomate, recebe presunto de Parma em fatias finíssimas, rúcula fresca e lascas de parmesão. Contraste perfeito entre quente e frio.',
    ingredients: ['Presunto de Parma', 'Rúcula', 'Mozzarella', 'Parmesão', 'Tomate'],
    image: '/images/pizza-rucula',
    imageAlt: 'Fatias de pizza com rúcula fresca sobre papel manteiga',
    variants: pizzaSizes(5600, 7800, 9800),
  },
];

const massas: Seed[] = [
  {
    slug: 'spaghetti-a-bolonhesa',
    categoryId: 'massas',
    name: 'Spaghetti à Bolonhesa',
    shortDescription: 'Ragu de carne cozido por 6 horas, parmesão e manjericão.',
    description:
      'Spaghetti fresco com ragu de acém e linguiça cozido lentamente por seis horas com vinho tinto e tomate pelado. Finalizado com parmesão e manjericão.',
    ingredients: ['Spaghetti fresco', 'Ragu de carne', 'Vinho tinto', 'Parmesão', 'Manjericão'],
    image: '/images/massa-bolonhesa',
    imageAlt: 'Prato de spaghetti à bolonhesa com tomates-cereja ao redor',
    variants: pastaSizes(5200, 8900),
    featured: true,
  },
  {
    slug: 'fettuccine-alfredo',
    categoryId: 'massas',
    name: 'Fettuccine Alfredo',
    shortDescription: 'Manteiga de primeira, parmesão 12 meses e pimenta-do-reino.',
    description:
      'Fettuccine fresco emulsionado em manteiga e parmesão curado por 12 meses, até virar um creme sedoso. Pimenta-do-reino moída na hora.',
    ingredients: ['Fettuccine fresco', 'Manteiga', 'Parmesão 12 meses', 'Pimenta-do-reino'],
    image: '/images/massa-alfredo',
    imageAlt: 'Fettuccine alfredo cremoso servido em prato de cerâmica',
    variants: pastaSizes(4900, 8400),
    badges: ['vegetariano'],
  },
  {
    slug: 'penne-quatro-queijos',
    categoryId: 'massas',
    name: 'Penne aos Quatro Queijos',
    shortDescription: 'Molho de gorgonzola, parmesão, provolone e mozzarella.',
    description:
      'Penne rigate grano duro em molho cremoso de quatro queijos — gorgonzola, parmesão, provolone e mozzarella — gratinado rapidamente no forno.',
    ingredients: ['Penne rigate', 'Gorgonzola', 'Parmesão', 'Provolone', 'Mozzarella'],
    image: '/images/massa-penne-quatro-queijos',
    imageAlt: 'Massa ao molho branco cremoso com salsinha em tigela de vidro',
    variants: pastaSizes(5100, 8700),
    badges: ['vegetariano'],
  },
  {
    slug: 'penne-arrabbiata',
    categoryId: 'massas',
    name: "Penne all'Arrabbiata",
    shortDescription: 'Tomate pelado, alho, pimenta calabresa e salsinha.',
    description:
      'Molho de tomate pelado com alho dourado no azeite e pimenta calabresa. Picante na medida certa, finalizado com salsinha e pecorino.',
    ingredients: ['Penne', 'Tomate pelado', 'Alho', 'Pimenta calabresa', 'Pecorino'],
    image: '/images/massa-penne-arrabbiata',
    imageAlt: 'Penne ao molho de tomate com queijo ralado em prato branco',
    variants: pastaSizes(4500, 7800),
    badges: ['picante', 'vegetariano'],
  },
  {
    slug: 'lasanha-a-bolonhesa',
    categoryId: 'massas',
    name: 'Lasanha à Bolonhesa',
    shortDescription: 'Camadas de massa fresca, ragu, bechamel e parmesão gratinado.',
    description:
      'Oito camadas de massa fresca intercaladas com ragu de carne, molho bechamel e mozzarella. Gratinada com parmesão até formar a casquinha.',
    ingredients: ['Massa fresca', 'Ragu de carne', 'Bechamel', 'Mozzarella', 'Parmesão'],
    image: '/images/massa-lasanha-bolonhesa',
    imageAlt: 'Porção de lasanha gratinada sobre molho de tomate',
    variants: pastaSizes(5600, 9600),
    featured: true,
  },
  {
    slug: 'lasanha-de-frango',
    categoryId: 'massas',
    name: 'Lasanha de Frango',
    shortDescription: 'Frango desfiado, Catupiry, molho de tomate e manjericão.',
    description:
      'Massa fresca em camadas com frango caipira desfiado, Catupiry original e molho de tomate com manjericão. Gratinada com mozzarella.',
    ingredients: ['Massa fresca', 'Frango desfiado', 'Catupiry', 'Molho de tomate', 'Mozzarella'],
    image: '/images/massa-lasanha-frango',
    imageAlt: 'Lasanha servida em prato com manjericão e tomates ao lado',
    variants: pastaSizes(5400, 9200),
  },
  {
    slug: 'talharim-ao-ragu-da-casa',
    categoryId: 'massas',
    name: 'Talharim ao Ragu da Casa',
    shortDescription: 'Talharim largo com ragu de costela desfiada e redução de vinho.',
    description:
      'Nosso molho especial: costela bovina braseada por 8 horas, desfiada e reduzida com vinho tinto. Servido sobre talharim largo feito à mão.',
    ingredients: ['Talharim fresco', 'Costela braseada', 'Vinho tinto', 'Salsinha', 'Parmesão'],
    image: '/images/massa-talharim-ragu',
    imageAlt: 'Talharim largo com ragu de carne desfiada em prato escuro',
    variants: pastaSizes(5900, 9900),
    badges: ['assinatura'],
    featured: true,
  },
  {
    slug: 'spaghetti-carbonara',
    categoryId: 'massas',
    name: 'Spaghetti Carbonara',
    shortDescription: 'Guanciale, gemas caipiras, pecorino romano e pimenta.',
    description:
      'A receita romana sem creme de leite: guanciale crocante, gemas caipiras, pecorino romano e muita pimenta-do-reino.',
    ingredients: ['Spaghetti', 'Guanciale', 'Gemas caipiras', 'Pecorino romano', 'Pimenta-do-reino'],
    image: '/images/massa-carbonara',
    imageAlt: 'Spaghetti carbonara com cubos de guanciale em prato branco',
    variants: pastaSizes(5400, 9200),
  },
  {
    slug: 'ravioli-da-casa',
    categoryId: 'massas',
    name: 'Ravioli Artesanal da Casa',
    shortDescription: 'Recheado de ricota e limão-siciliano, na manteiga de sálvia.',
    description:
      'Nossa massa artesanal: ravioli recheado com ricota fresca e raspas de limão-siciliano, servido na manteiga noisette com sálvia e parmesão.',
    ingredients: ['Ravioli fresco', 'Ricota', 'Limão-siciliano', 'Manteiga de sálvia', 'Parmesão'],
    image: '/images/massa-ravioli',
    imageAlt: 'Raviolis artesanais com parmesão ralado em prato preto',
    variants: pastaSizes(5600, 9600),
    badges: ['vegetariano'],
  },
  {
    slug: 'spaghetti-ao-mar',
    categoryId: 'massas',
    name: 'Spaghetti ao Mar',
    shortDescription: 'Camarões, tomate-cereja, alho, vinho branco e salsinha.',
    description:
      'Camarões salteados no azeite com alho, tomates-cereja e vinho branco, finalizados com salsinha e um toque de pimenta.',
    ingredients: ['Spaghetti', 'Camarão', 'Tomate-cereja', 'Vinho branco', 'Salsinha'],
    image: '/images/massa-frutos-do-mar',
    imageAlt: 'Spaghetti com camarões e tomates-cereja em frigideira escura',
    variants: pastaSizes(6900, 11900),
    badges: ['novidade'],
  },
];

const drink = (
  slug: string,
  name: string,
  shortDescription: string,
  price: number,
  extra: Partial<Seed> = {},
): Seed => ({
  slug,
  categoryId: 'bebidas',
  name,
  shortDescription,
  description: shortDescription,
  ingredients: [],
  variants: [{ id: 'un', label: 'Unidade', price }],
  addonGroupIds: [],
  ...extra,
});

const bebidas: Seed[] = [
  drink('coca-cola-lata', 'Coca-Cola', 'Lata 350 ml', 700),
  drink('coca-cola-zero-lata', 'Coca-Cola Zero', 'Lata 350 ml · sem açúcar', 700, { badges: ['zero'] }),
  drink('coca-cola-2l', 'Coca-Cola 2 litros', 'Garrafa 2 L · ideal para dividir', 1600),
  drink('guarana-lata', 'Guaraná Antarctica', 'Lata 350 ml', 650),
  drink('guarana-zero-lata', 'Guaraná Antarctica Zero', 'Lata 350 ml · sem açúcar', 650, { badges: ['zero'] }),
  drink('guarana-2l', 'Guaraná Antarctica 2 litros', 'Garrafa 2 L · ideal para dividir', 1400),
  drink('sprite-lata', 'Sprite', 'Lata 350 ml · limão', 650),
  drink('agua-sem-gas', 'Água mineral', 'Garrafa 500 ml · sem gás', 450),
  drink('agua-com-gas', 'Água com gás', 'Garrafa 500 ml', 500),
  drink('suco-de-laranja', 'Suco de laranja', '500 ml · espremido na hora', 1400),
  drink('limonada-siciliana', 'Limonada siciliana', '500 ml · com hortelã', 1500, { badges: ['novidade'] }),
];

export const seedProducts: Product[] = [...pizzas, ...massas, ...bebidas].map((p, index) => ({
  id: `prd_${p.slug}`,
  sortOrder: index,
  active: true,
  featured: false,
  badges: [],
  addonGroupIds:
    p.categoryId === 'pizzas' ? ['borda', 'extras-pizza'] : p.categoryId === 'massas' ? ['extras-massa'] : [],
  ...p,
}));

export const seedSettings: StoreSettings = {
  storeName: 'Nazário Massas',
  phone: '(11) 3456-7890',
  whatsapp: '5511934567890',
  address: 'Rua dos Fornos, 148 — Vila Madalena, São Paulo · SP',
  hours: 'Terça a domingo, 18h às 23h30',
  isOpen: true,
  deliveryEnabled: false,
  deliveryFee: 790,
  freeDeliveryFrom: 15000,
  minOrder: 3000,
  deliveryEstimate: '40–55 min',
  pickupEstimate: '20–30 min',
  coupons: [
    {
      code: 'BEMVINDO10',
      kind: 'percent',
      value: 10,
      minSubtotal: 6000,
      active: true,
      description: '10% no primeiro pedido acima de R$ 60',
    },
    {
      code: 'NAZARIO20',
      kind: 'fixed',
      value: 2000,
      minSubtotal: 12000,
      active: true,
      description: 'R$ 20 de desconto acima de R$ 120',
    },
  ],
};
