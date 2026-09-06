// Picks the AI provider from the environment so routes never depend on a
// specific vendor. A new provider is one adapter exporting the same three
// functions: id, isConfigured, complete.

const gemini = require('./providers/gemini');

const PROVIDERS = { gemini };

// Tried in this order when AI_PROVIDER is not set
const FALLBACK_ORDER = ['gemini'];

function resolveProvider() {
  const requested = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  if (requested) {
    const provider = PROVIDERS[requested];
    if (!provider) {
      throw new Error(
        `Unknown AI_PROVIDER "${requested}". Supported: ${Object.keys(PROVIDERS).join(', ')}.`,
      );
    }
    // A misconfigured preference should not take the feature offline
    if (provider.isConfigured()) return provider;
  }

  for (const name of FALLBACK_ORDER) {
    if (PROVIDERS[name].isConfigured()) return PROVIDERS[name];
  }
  return null;
}

const isAvailable = () => resolveProvider() !== null;

function describe() {
  const provider = resolveProvider();
  return {
    available: !!provider,
    provider: provider?.id || null,
    model: provider?.model?.() || null,
    configured: Object.fromEntries(
      Object.entries(PROVIDERS).map(([name, p]) => [name, p.isConfigured()]),
    ),
  };
}

// The prompts ask models not to use em dashes, but that instruction does not
// hold, so replies are corrected here. The en dash is left alone because it
// carries meaning in ranges like "7-8 hours".
function stripEmDashes(text) {
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/,\s*([.!?;:])/g, '$1')
    .replace(/([([])\s*,\s*/g, '$1')
    .replace(/,\s*$/gm, '');
}

async function ask({ system, messages, maxTokens }) {
  const provider = resolveProvider();
  if (!provider) {
    const err = new Error(
      'No AI provider is configured. Set GEMINI_API_KEY on the server. '
      + 'A free key is available at aistudio.google.com.',
    );
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
  const reply = await provider.complete({ system, messages, maxTokens });
  return stripEmDashes(reply);
}

// Caps history length and size before it reaches a provider
function sanitizeMessages(messages, { maxTurns = 20, maxChars = 4000 } = {}) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-maxTurns)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.trim().slice(0, maxChars),
    }));
}

module.exports = { ask, isAvailable, describe, sanitizeMessages, resolveProvider, stripEmDashes };
