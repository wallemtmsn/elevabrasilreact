// Mapa de dados estáticos dos cursos indexado por slug (título normalizado).
// Complementa os dados do Supabase com imagem, normas, categoria e objetivos de aprendizagem.

export type CourseCategory = 'operacional' | 'desenvolvimento' | 'nr'

export interface CourseStaticData {
  image: string
  hours: string
  norms: string
  category: CourseCategory
  objectives: string[]
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const courseDataMap: Record<string, CourseStaticData> = {
  'operador-de-empilhadeira': {
    image: '/assets/img/empilhadeira.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-12, NR-17',
    category: 'operacional',
    objectives: [
      'Operar empilhadeiras com segurança em ambientes industriais e portuários',
      'Aplicar as normas regulamentadoras NR-11, NR-12 e NR-17 na prática',
      'Identificar e prevenir riscos operacionais durante a movimentação de cargas',
      'Realizar inspeções pré-operacionais no equipamento',
      'Executar manobras em espaços reduzidos e situações de risco controlado',
      'Obter habilitação reconhecida para atuar em diversas áreas industriais',
    ],
  },
  'operador-de-guindaste': {
    image: '/assets/img/guindaste.jpg',
    hours: '120h',
    norms: 'NR-06, NR-10, NR-11, NR-17, NR-34',
    category: 'operacional',
    objectives: [
      'Operar guindastes fixos e móveis em ambientes offshore, portos e plataformas',
      'Compreender os princípios de segurança para içamento de cargas',
      'Aplicar NR-11 e NR-34 na operação de guindastes em ambiente naval',
      'Realizar cálculos básicos de carga e estabilidade do equipamento',
      'Identificar riscos elétricos e de interferência conforme NR-10',
      'Obter certificação com ART para atuação profissional',
    ],
  },
  'operador-de-guindauto': {
    image: '/assets/img/guindauto.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar guindauto (caminhão munck) com segurança',
      'Realizar inspeções de segurança pré-operacionais',
      'Compreender as limitações de carga e alcance do equipamento',
      'Aplicar técnicas corretas de içamento e posicionamento de cargas',
      'Receber ART (Anotação de Responsabilidade Técnica)',
    ],
  },
  'operador-de-pemt': {
    image: '/assets/img/pemt.jpg',
    hours: '20h',
    norms: 'NR-06, NR-10, NR-11, NR-17, NR-18',
    category: 'operacional',
    objectives: [
      'Operar plataformas elevatórias móveis de trabalho (tesoura e articulada)',
      'Identificar riscos elétricos durante trabalhos em altura conforme NR-10',
      'Aplicar requisitos de segurança da NR-18 em obras e construção',
      'Realizar inspeções e manutenção básica do equipamento',
      'Executar procedimentos de emergência e evacuação',
    ],
  },
  'operador-de-escavadeira-hidraulica': {
    image: '/assets/img/escavadeira.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar escavadeira hidráulica com segurança e eficiência',
      'Realizar escavações, demolições e movimentação de terra',
      'Identificar tipos de solo e adaptar a operação às condições do terreno',
      'Aplicar normas de segurança NR-11 e NR-17',
      'Executar inspeções e manutenção preventiva básica',
    ],
  },
  'operador-de-pa-carregadeira': {
    image: '/assets/img/pa-carregadeira.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar pá carregadeira em mineração, construção e indústria',
      'Compreender os limites de carga e estabilidade do equipamento',
      'Realizar carregamento eficiente de caminhões e tratamento de material',
      'Aplicar normas de segurança na operação',
      'Executar manutenção preventiva básica do equipamento',
    ],
  },
  'operador-de-retro-escavadeira': {
    image: '/assets/img/retro-escavadeira.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar retroescavadeira em obras civis e saneamento',
      'Realizar abertura de valas, remoção de terra e demolição',
      'Compreender os dois modos de operação do equipamento (frontal e traseiro)',
      'Aplicar normas de segurança NR-11 e NR-17',
      'Executar inspeções pré-operacionais e manutenção básica',
    ],
  },
  'operador-de-trator': {
    image: '/assets/img/trator.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar tratores agrícolas e industriais com segurança',
      'Utilizar implementos e acessórios acoplados ao trator',
      'Identificar riscos de tombamento e capotagem em terrenos irregulares',
      'Aplicar técnicas de operação em diferentes tipos de solo',
      'Realizar manutenção preventiva básica',
    ],
  },
  'operador-de-mini-escavadeira': {
    image: '/assets/img/mini-escavadeira.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar mini escavadeira hidráulica em espaços reduzidos',
      'Realizar escavações precisas em obras urbanas e de saneamento',
      'Identificar limitações e vantagens do equipamento compacto',
      'Aplicar normas de segurança NR-11 e NR-17',
      'Executar inspeções e manutenção preventiva básica',
    ],
  },
  'operador-de-ponte-rolante': {
    image: '/assets/img/ponte-rolante.jpg',
    hours: '20h',
    norms: 'NR-06, NR-10, NR-11, NR-17, NR-34',
    category: 'operacional',
    objectives: [
      'Operar pontes rolantes em indústrias, estaleiros e plataformas',
      'Realizar içamento, movimentação e posicionamento de cargas com precisão',
      'Identificar riscos elétricos e aplicar NR-10 na operação',
      'Aplicar sinalização e comunicação com riggers e sinaleiros',
      'Inspecionar cabos, ganchos e acessórios de içamento',
    ],
  },
  'operador-de-manipulador-telescopico': {
    image: '/assets/img/manipulador-telescopico.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar manipulador telescópico (telehandler) em obras e indústria',
      'Realizar movimentação de cargas em locais de difícil acesso',
      'Utilizar acessórios como garfo e caçamba com segurança',
      'Aplicar normas NR-11 e NR-17 na operação',
      'Identificar limites de carga em diferentes configurações do lança',
    ],
  },
  'operador-de-jumbo': {
    image: '/assets/img/jumbo.jpg',
    hours: '20h',
    norms: 'NR-06, NR-11, NR-17',
    category: 'operacional',
    objectives: [
      'Operar jumbo de perfuração em mineração subterrânea',
      'Realizar perfurações precisas para detonação e ancoragem',
      'Identificar riscos específicos de ambientes subterrâneos',
      'Aplicar normas de segurança NR-11 e NR-17',
      'Executar manutenção básica e inspeção do equipamento',
    ],
  },
  'nr-11-movimentacao-de-cargas': {
    image: '/assets/img/nr11-movimentacao.jpg',
    hours: '16h',
    norms: 'NR-06, NR-10, NR-11, NR-17, NR-34',
    category: 'desenvolvimento',
    objectives: [
      'Compreender os requisitos legais da NR-11 para movimentação de cargas',
      'Identificar e inspecionar acessórios de içamento (cabos, cintas, manilhas)',
      'Calcular cargas seguras e fator de segurança dos acessórios',
      'Aplicar técnicas corretas de amarração e estabilização de cargas',
      'Comunicar-se eficientemente com operadores de guindaste',
    ],
  },
  'rigger-sinaleiro': {
    image: '/assets/img/rigger-sinaleiro.jpg',
    hours: '16h',
    norms: 'NR-06, NR-10, NR-11, NR-17, NR-34',
    category: 'desenvolvimento',
    objectives: [
      'Realizar amarração e preparação de cargas para içamento com segurança',
      'Utilizar sinais padronizados para comunicação com operadores de guindaste',
      'Inspecionar e selecionar acessórios de içamento adequados para cada carga',
      'Aplicar técnicas de equilíbrio e estabilização de cargas irregulares',
      'Atuar conforme NR-11 e NR-34 em ambientes naval e offshore',
    ],
  },
  'inspecao-de-acessorios': {
    image: '/assets/img/inspecao-acessorios.jpg',
    hours: '16h',
    norms: 'NR-06, NR-10, NR-11, NR-17, NR-34',
    category: 'desenvolvimento',
    objectives: [
      'Inspecionar cabos de aço, cintas, manilhas e ganchos conforme normas',
      'Identificar defeitos, desgastes e condições de descarte de acessórios',
      'Registrar e documentar inspeções com emissão de laudo',
      'Aplicar critérios normativos da NR-11 para descarte de acessórios',
      'Receber ART (Anotação de Responsabilidade Técnica)',
    ],
  },
  'carreira-profissional': {
    image: '/assets/img/carreira-profissional.jpg',
    hours: '8h',
    norms: '-',
    category: 'desenvolvimento',
    objectives: [
      'Desenvolver competências comportamentais para o ambiente de trabalho',
      'Elaborar currículo profissional e se preparar para entrevistas',
      'Compreender a hierarquia organizacional e como crescer dentro de empresas',
      'Praticar comunicação assertiva e trabalho em equipe',
      'Definir metas de carreira de curto e longo prazo',
    ],
  },
  'nr-05-formacao-de-membros-de-cipa': {
    image: '/assets/img/nr05-cipa.jpg',
    hours: '16h',
    norms: 'NR-05',
    category: 'nr',
    objectives: [
      'Compreender a estrutura e o funcionamento da CIPA nas empresas',
      'Aplicar regulamentações do MTE e legislações trabalhistas vigentes',
      'Identificar e mapear riscos ambientais no local de trabalho',
      'Elaborar e apresentar o Mapa de Riscos da empresa',
      'Atuar na prevenção de acidentes e promoção da saúde ocupacional',
      'Administrar os primeiros socorros em situações de emergência',
    ],
  },
  'nr-06-epi-equipamentos-de-protecao-individual': {
    image: '/assets/img/nr06-epi.jpg',
    hours: '8h',
    norms: 'NR-06',
    category: 'nr',
    objectives: [
      'Compreender a obrigatoriedade e responsabilidades sobre o uso de EPIs',
      'Selecionar o EPI correto para cada tipo de risco e atividade',
      'Realizar a conservação, higienização e armazenamento correto dos EPIs',
      'Identificar exemplos de acidentes causados pelo não uso de EPIs',
      'Conhecer os direitos e deveres de empregados e empregadores sobre EPIs',
    ],
  },
  'nr-10-seguranca-em-instalacoes-e-servicos-com-eletricidade': {
    image: '/assets/img/nr10-eletricidade.jpg',
    hours: '40h',
    norms: 'NR-10',
    category: 'nr',
    objectives: [
      'Identificar os riscos elétricos em instalações e serviços com eletricidade',
      'Aplicar medidas de controle e prevenção de acidentes elétricos',
      'Operar com segurança em instalações elétricas energizadas e desenergizadas',
      'Utilizar EPIs e EPCs específicos para trabalhos elétricos',
      'Compreender os fundamentos de eletricidade e sistemas de distribuição',
      'Atender os requisitos legais da NR-10 para habilitação profissional',
    ],
  },
  'nr-12-seguranca-na-operacao-de-maquinas-e-equipamentos': {
    image: '/assets/img/nr12-maquinas.jpg',
    hours: '16h',
    norms: 'NR-12',
    category: 'nr',
    objectives: [
      'Compreender os requisitos de segurança da NR-12 para máquinas e equipamentos',
      'Identificar os riscos associados à operação de diferentes tipos de máquinas',
      'Verificar dispositivos de segurança: proteções, intertravamentos e paradas de emergência',
      'Aplicar procedimentos de bloqueio e etiquetagem (LOTO)',
      'Obter habilitação para operação segura conforme exigência da NR-12',
    ],
  },
  'nr-20-liquidos-inflamaveis': {
    image: '/assets/img/nr20-inflamaveis.jpg',
    hours: '8h',
    norms: 'NR-20',
    category: 'nr',
    objectives: [
      'Identificar as classes de inflamáveis e combustíveis líquidos conforme NR-20',
      'Compreender os riscos de incêndio e explosão em instalações com inflamáveis',
      'Aplicar medidas de prevenção e controle de riscos em postos e refinarias',
      'Utilizar equipamentos de proteção adequados para trabalho com inflamáveis',
      'Atender aos procedimentos de emergência em caso de vazamentos e incêndios',
    ],
  },
  'nr-33-espacos-confinados': {
    image: '/assets/img/nr33-confinados.jpg',
    hours: '16h',
    norms: 'NR-33',
    category: 'nr',
    objectives: [
      'Identificar e classificar espaços confinados conforme NR-33',
      'Reconhecer e avaliar os riscos presentes em espaços confinados',
      'Aplicar medidas de controle: ventilação, monitoramento atmosférico e EPI',
      'Executar o procedimento de entrada e trabalho seguro em espaços confinados',
      'Atuar como vigia, supervisor de entrada ou entrante conforme o papel designado',
    ],
  },
  'nr-34-construcao-e-reparacao-naval': {
    image: '/assets/img/nr34-naval.jpg',
    hours: '6-20h',
    norms: 'NR-34',
    category: 'nr',
    objectives: [
      'Compreender os requisitos de qualificação da NR-34 para a indústria naval',
      'Identificar os riscos específicos da construção e reparação de embarcações',
      'Aplicar normas de segurança em trabalhos com solda, pintura e estruturas navais',
      'Utilizar EPIs adequados para as atividades de estaleiro',
      'Atender às exigências legais para trabalho em estaleiros e plataformas',
    ],
  },
  'nr-35-trabalho-em-altura': {
    image: '/assets/img/nr35-altura.jpg',
    hours: '8h',
    norms: 'NR-35',
    category: 'nr',
    objectives: [
      'Compreender os requisitos mínimos da NR-35 para trabalho em altura',
      'Identificar os riscos de queda e aplicar medidas de prevenção',
      'Utilizar corretamente o cinto de segurança, talabarte e linha de vida',
      'Planejar e executar trabalhos em altura com Análise de Risco (AR)',
      'Realizar inspeção de EPIs antes de cada uso em altura',
      'Executar procedimentos de resgate em caso de quedas ou emergências',
    ],
  },
}
