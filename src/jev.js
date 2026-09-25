import { questions } from './scenario.js';

const URL = 'https://openrouter.ai/api/alpha/decisions';

export async function runJev({ state, apiKey, model }) {
  const t0 = performance.now();
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, state, questions }),
  });
  const latencyMs = performance.now() - t0;
  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = raw?.error?.message || raw?.message || res.statusText;
    return { ok: false, model, latencyMs, raw, error: `HTTP ${res.status}: ${msg}` };
  }

  const a = raw.answers || {};
  const urgLegend = a.urgencia?.legend || {};
  const urgIdx = Math.round(a.urgencia?.score ?? 0);

  return {
    ok: true,
    model: raw.model || model,
    latencyMs,
    costUsd: raw.usage?.cost ?? null,
    usage: raw.usage,
    validOutput: true, // saída tipada por construção
    result: {
      categoria: a.categoria?.choice,
      urgencia: urgLegend[urgIdx] ?? questions.urgencia.criteria[urgIdx],
      escalar_humano: (a.escalar_humano?.noul ?? 0) >= 0.5,
    },
    details: {
      categoria: { probabilities: a.categoria?.probabilities, confidence: a.categoria?.confidence },
      urgencia: {
        score: a.urgencia?.score,
        probabilities: Object.fromEntries(
          Object.entries(a.urgencia?.probabilities || {}).map(([k, v]) => [urgLegend[k] ?? k, v]),
        ),
        confidence: a.urgencia?.confidence,
      },
      escalar_humano: { noul: a.escalar_humano?.noul },
    },
    raw,
  };
}
