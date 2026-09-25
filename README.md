# Jev vs LLM: triagem de chamados

Demo didática que coloca o **Jev** (modelo *System 1* da [TypeSafe AI](https://typesafe.ai)) e um **LLM tradicional** para resolver a mesma tarefa, lado a lado, comparando **tempo, custo e resultado**.

Tudo roda via [OpenRouter](https://openrouter.ai) com **uma única API key**.

---

## Por que isso existe?

LLMs geram texto token a token. Isso é ótimo para conversar, mas é caro e lento quando você só precisa de uma **decisão**: "qual time atende isso?", "é urgente?", "precisa de um humano?".

O Jev é um modelo *System 1*: em vez de escrever uma resposta, ele devolve **decisões tipadas com probabilidades e confiança**. Esta demo deixa essa diferença visível com números.

| | Jev (System 1) | LLM |
|---|---|---|
| Saída | Valores tipados (choice, score, noul) | Texto (que você torce para ser JSON válido) |
| Incerteza | Probabilidades por opção + confiança | Não tem uma calibrada |
| Formato | Garantido pela API | Depende do modelo e do prompt |

## O cenário

Uma loja online recebe mensagens de clientes que precisam ser encaminhadas na hora. Para cada mensagem, os dois modelos respondem às **mesmas três perguntas tipadas**:

| Pergunta | Tipo | Opções |
|---|---|---|
| `categoria` | `choice` | reembolso · entrega · tecnico · comercial · spam |
| `urgencia` | `score` | Pode esperar → Resolver hoje → Crítico agora |
| `escalar_humano` | `noul` (sim/não) | true · false |

Há 5 mensagens de exemplo (clara, ambígua, spam, raivosa, comercial), e você pode escrever as suas.

## O que você vê na tela

- **Dois cards lado a lado (Jev e LLM)**, cada um com tempo, custo em US$, tokens e a decisão
- **Barras de probabilidade** no Jev, que mostram o quanto ele "hesitou" entre as opções
- **Selo de saída válida/inválida** no LLM, que indica se ele respeitou o formato
- **Faixa comparativa**: "Nx mais rápido", "Nx mais barato" e se os dois concordaram
- **Histórico** das execuções da sessão
- **Menu** para trocar o LLM de comparação (GPT, Claude, Gemini, Llama…)

## Como rodar

Pré-requisitos: [Docker](https://docs.docker.com/get-docker/) e uma [API key do OpenRouter](https://openrouter.ai/keys) com créditos.

```bash
git clone <este-repo>
cd jev-demo
cp .env.example .env      # coloque sua OPENROUTER_API_KEY
docker compose up --build
```

Abra **http://localhost:3000**.

> Cada execução custa frações de centavo (duas chamadas: uma ao Jev e outra ao LLM).

### Sem Docker

Com Node 22+:

```bash
npm install
node --env-file=.env src/server.js
```

## Configuração (`.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `OPENROUTER_API_KEY` | Chave do OpenRouter (usada pelos dois modelos) | obrigatória |
| `JEV_MODEL` | Modelo do Jev | `typesafe/jev-1.13` |
| `LLM_MODELS` | Modelos do menu, separados por vírgula | `openai/gpt-4o-mini,anthropic/claude-haiku-4.5,…` |
| `PORT` | Porta do servidor | `3000` |

A chave fica **só no backend** e nunca é enviada ao navegador.

## Como funciona

```
Navegador ──POST /api/run──▶ Backend (Express)
                               ├──▶ OpenRouter /api/alpha/decisions      (Jev)
                               └──▶ OpenRouter /api/v1/chat/completions  (LLM)
                             (as duas em paralelo, tempo medido em cada uma)
```

- **Jev:** recebe o `state` (a mensagem) e as `questions` tipadas e devolve `answers` com `probabilities` e `confidence`.
- **LLM:** recebe um prompt gerado **a partir das mesmas questions**, com `response_format: json_schema` e `temperature: 0`. O backend valida o JSON retornado.
- **Custo:** o valor real vem de `usage.cost`, que o OpenRouter devolve para os dois.
- **Tempo:** medido no backend. Inclui a rede até o OpenRouter, então compare os dois entre si, não com números absolutos de benchmark.

## Estrutura

```
src/
  scenario.js   # cenário, perguntas tipadas e exemplos (fonte única)
  jev.js        # chamada ao Jev
  llm.js        # chamada ao LLM + validação da saída
  server.js     # Express: /api/config e /api/run
public/
  index.html    # interface (Tailwind + JS puro)
```

### Crie seu próprio cenário

Edite `src/scenario.js`: troque as `questions` (tipos `choice`, `score` ou `noul`) e os exemplos. O prompt e o JSON schema do LLM são gerados automaticamente a partir delas. Se você mudar os nomes dos campos, ajuste também a extração em `jev.js`/`llm.js` e a renderização em `index.html`.

## Referências

- [Jev no OpenRouter](https://openrouter.ai/docs/guides/community/jev)
- [Tutorial do Jev no OpenRouter](https://openrouter.ai/docs/guides/community/jev-tutorial)
- [Documentação da TypeSafe AI](https://docs.typesafe.ai/introduction)
- [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

---

Projeto independente e didático, sem vínculo com a TypeSafe AI ou o OpenRouter.
