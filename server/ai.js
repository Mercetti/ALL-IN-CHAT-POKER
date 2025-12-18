const Logger = require('./logger');
const config = require('./config');
const fetch = global.fetch;

const logger = new Logger('ai');

function assertProvider() {
  const provider = (config.AI_PROVIDER || 'openai').toLowerCase();
  if (!['openai', 'ollama'].includes(provider)) {
    throw new Error(`Unsupported AI provider: ${config.AI_PROVIDER}`);
  }
  if (provider === 'openai' && !config.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return provider;
}

async function chat(messages = [], options = {}) {
  const provider = assertProvider();
  const model =
    options.model ||
    (provider === 'ollama' ? (config.OLLAMA_MODEL || config.AI_MODEL || 'llama3') : (config.AI_MODEL || 'gpt-4o-mini'));
  const maxTokens = options.maxTokens || config.AI_MAX_TOKENS || 1200;
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.2;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.AI_TIMEOUT_MS || 15000);

  try {
    if (provider === 'ollama') {
      const res = await fetch(`${config.OLLAMA_HOST || 'http://127.0.0.1:11434'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages,
          options: { temperature, num_predict: maxTokens },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama request failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      const content = data?.message?.content || '';
      return (content || '').trim();
    }

    // OpenAI
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message?.content || '';
    return (choice || '').trim();
  } catch (err) {
    logger.error('AI chat failed', { error: err.message });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  chat,
};
