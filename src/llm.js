import { questions } from './scenario.js';

const URL = 'https://openrouter.ai/api/v1/chat/completions';

const categorias = Object.keys(questions.categoria.criteria);
const niveis = questions.urgencia.criteria;

// Prompt gerado a partir das mesmas perguntas enviadas ao Jev.
const systemPrompt = [
  'Você faz triagem de mensagens de clientes de uma loja online.',
  'Responda APENAS com um JSON no formato {"categoria": ..., "urgencia": ..., "escalar_humano": ...}.',
  '',
  `categoria — ${questions.categoria.instructions}`,
  ...Object.entries(questions.categoria.criteria).map(([k, v]) => `  - "${k}": ${v}`),
  '',
  `urgencia — ${questions.urgencia.instructions} Use exatamente um de:`,
  ...niveis.map((n) => `  - "${n}"`),
  '',
  `escalar_humano — ${questions.escalar_humano.instructions} (boolean)`,
  `  - true: ${questions.escalar_humano.criteria.true}`,
  `  - false: ${questions.escalar_humano.criteria.false}`,
].join('\n');

const schema = {
  name: 'triagem',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      categoria: { type: 'string', enum: categorias },
      urgencia: { type: 'string', enum: niveis },
      escalar_humano: { type: 'boolean' },
    },
    required: ['categoria', 'urgencia', 'escalar_humano'],
    additionalProperties: false,
  },
};

function parseJson(content) {
  if (typeof content !== 'string') return null;
  const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function isValid(r) {
  return (
    r &&
    categorias.includes(r.categoria) &&
    niveis.includes(r.urgencia) &&
    typeof r.escalar_humano === 'boolean'
  );
}

export async function runLlm({ state, apiKey, model }) {
  const t0 = performance.now();
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(state) },
      ],
      response_format: { type: 'json_schema', json_schema: schema },
      temperature: 0,
      usage: { include: true },
    }),
  });
  const latencyMs = performance.now() - t0;
  const raw = await res.json().catch(() => null);

  if (!res.ok || raw?.error) {
    const msg = raw?.error?.message || res.statusText;
    return { ok: false, model, latencyMs, raw, error: `HTTP ${res.status}: ${msg}` };
  }

  const content = raw.choices?.[0]?.message?.content;
  const parsed = parseJson(content);
  const validOutput = isValid(parsed);

  return {
    ok: true,
    model: raw.model || model,
    latencyMs,
    costUsd: raw.usage?.cost ?? null,
    usage: {
      input_tokens: raw.usage?.prompt_tokens,
      output_tokens: raw.usage?.completion_tokens,
      cost: raw.usage?.cost,
    },
    validOutput,
    result: parsed ?? { texto_bruto: content },
    details: null, // LLM não entrega probabilidades calibradas
    raw,
  };
}
