const Logger = require('./logger');
const config = require('./config');
const fetch = global.fetch;

const logger = new Logger('ai');

function buildAuthHeader() {
  if (config.AI_PROVIDER !== 'openai') {
    throw new Error(`Unsupported AI provider: ${config.AI_PROVIDER}`);
  }
  if (!config.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return { Authorization: `Bearer ${config.OPENAI_API_KEY}` };
}

async function chat(messages = [], options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...buildAuthHeader(),
  };
  const model = options.model || config.AI_MODEL || 'gpt-4o-mini';
  const maxTokens = options.maxTokens || config.AI_MAX_TOKENS || 1200;
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.2;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.AI_TIMEOUT_MS || 15000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
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
