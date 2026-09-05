/**
 * Anthropic provider.
 *
 * Retained as an alternative to Gemini. Selected by setting AI_PROVIDER=anthropic
 * with a funded ANTHROPIC_API_KEY. The SDK is an optional dependency: if it is
 * not installed, this provider simply reports itself as unavailable rather than
 * crashing the server at startup.
 */

const id = 'anthropic';

let Anthropic = null;
try {
  // eslint-disable-next-line global-require
  Anthropic = require('@anthropic-ai/sdk');
} catch {
  Anthropic = null;
}

const model = () => process.env.ANTHROPIC_MODEL;

const isConfigured = () => Boolean(Anthropic && process.env.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
};

async function complete({ system, messages, maxTokens = 1024 }) {
  if (!Anthropic) throw new Error('@anthropic-ai/sdk is not installed');
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

  const response = await getClient().messages.create({
    model: model(),
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  });

  const text = (response.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('The assistant returned an empty response.');
  return text;
}

module.exports = { id, isConfigured, complete, model };
