import express from 'express';
import { fileURLToPath } from 'node:url';
import { scenario, questions, examples } from './scenario.js';
import { runJev } from './jev.js';
import { runLlm } from './llm.js';

const apiKey = process.env.OPENROUTER_API_KEY;
const jevModel = process.env.JEV_MODEL || 'typesafe/jev-1.13';
const llmModels = (
  process.env.LLM_MODELS ||
  'openai/gpt-4o-mini,anthropic/claude-haiku-4.5,google/gemini-2.5-flash,meta-llama/llama-3.3-70b-instruct'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

if (!apiKey) console.warn('⚠ OPENROUTER_API_KEY não definida — configure o arquivo .env');

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

app.get('/api/config', (_req, res) => {
  res.json({ scenario, questions, examples, jevModel, llmModels, hasKey: Boolean(apiKey) });
});

function settle(p) {
  return p.status === 'fulfilled' ? p.value : { ok: false, error: String(p.reason?.message || p.reason) };
}

app.post('/api/run', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const llmModel = req.body?.llmModel;

  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada no .env' });
  if (!message) return res.status(400).json({ error: 'Mensagem vazia' });
  if (message.length > 4000) return res.status(400).json({ error: 'Mensagem muito longa (máx. 4000)' });
  if (!llmModels.includes(llmModel)) return res.status(400).json({ error: 'Modelo LLM não permitido' });

  const state = { canal: scenario.channel, mensagem: message };
  const [jev, llm] = await Promise.allSettled([
    runJev({ state, apiKey, model: jevModel }),
    runLlm({ state, apiKey, model: llmModel }),
  ]);

  res.json({ state, jev: settle(jev), llm: settle(llm) });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`JEV demo em http://localhost:${port}`));
