// Fonte única do cenário: as mesmas perguntas tipadas vão para o Jev e para o LLM.

export const scenario = {
  title: 'Triagem de chamados de suporte',
  summary:
    'Uma loja online recebe centenas de mensagens por hora. Cada uma precisa ser ' +
    'encaminhada na hora: para qual time vai, quão urgente é e se precisa de um humano já. ' +
    'É uma decisão, não um texto — exatamente o tipo de tarefa para a qual o Jev foi feito.',
  channel: 'chat do site',
};

export const questions = {
  categoria: {
    type: 'choice',
    instructions: 'Qual time deve cuidar desta mensagem?',
    criteria: {
      reembolso: 'Pedido de devolução, estorno ou dinheiro de volta.',
      entrega: 'Atraso, rastreio, extravio ou problema com o transporte.',
      tecnico: 'Erro no site, app, login, pagamento que não processa.',
      comercial: 'Dúvida sobre produto, preço, estoque ou interesse em comprar.',
      spam: 'Propaganda, golpe, mensagem sem relação com a loja.',
    },
  },
  urgencia: {
    type: 'score',
    instructions: 'Quão urgente é este atendimento?',
    criteria: ['Pode esperar', 'Resolver hoje', 'Crítico agora'],
  },
  escalar_humano: {
    type: 'noul',
    instructions: 'Esta mensagem exige atendimento humano imediato?',
    criteria: {
      true: 'Cliente muito irritado, ameaça jurídica/reclamação pública, ou caso sensível.',
      false: 'Pode ser resolvido por fluxo automático ou fila normal.',
    },
  },
};

export const examples = [
  {
    label: 'Clara',
    text: 'Olá, comprei um fone semana passada e ele veio com defeito. Gostaria de devolver e receber meu dinheiro de volta.',
  },
  {
    label: 'Ambígua',
    text: 'O pedido 48213 diz entregue mas não recebi nada, e agora o app nem abre pra eu ver o rastreio.',
  },
  {
    label: 'Spam',
    text: 'GANHE R$5.000 POR SEMANA trabalhando de casa!!! Clique no link e cadastre-se já.',
  },
  {
    label: 'Raivosa',
    text: 'TERCEIRA VEZ que cobram meu cartão em duplicidade. Se não resolverem HOJE vou no Procon e expor vocês no Reclame Aqui.',
  },
  {
    label: 'Comercial',
    text: 'Vocês têm a air fryer de 5 litros em estoque na cor preta? Parcelam em quantas vezes?',
  },
];
