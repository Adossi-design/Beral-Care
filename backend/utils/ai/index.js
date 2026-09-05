/**
 * AI provider registry.
 *
 * Routes call `ask()` and never learn which model answered. Swapping providers
 * is an environment change (AI_PROVIDER=gemini|anthropic), not a code change,
 * and adding a third means writing one adapter with the same three exports —
 * `id`, `isConfigured()`, and `complete()`.
 */

const gemini = require('./providers/gemini');
const anthropic = require('./providers/anthropic');

const PROVIDERS = { gemini, anthropic };

/** Preference order when AI_PROVIDER is not set: free tier first. */
const FALLBACK_ORDER = ['gemini', 'anthropic'];

/**
 * Resolves the provider to use.
 * An explicit AI_PROVIDER wins if it is configured; otherwise the first
 * configured provider in preference order is used.
 */
function resolveProvider() {
  const requested = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  if (requested) {
    const provider = PROVIDERS[requested];
    if (!provider) {
      throw new Error(
        `Unknown AI_PROVIDER "${requested}". Supported: ${Object.keys(PROVIDERS).join(', ')}.`,
      );
    }
    if (provider.isConfigured()) return provider;
    // Fall through to any other configured provider rather than failing hard —
    // a misconfigured preference should not take the feature offline.
  }

  for (const name of FALLBACK_ORDER) {
    if (PROVIDERS[name].isConfigured()) return PROVIDERS[name];
  }
  return null;
}

const isAvailable = () => resolveProvider() !== null;

/** Reports which provider is active, for diagnostics and the health endpoint. */
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

/**
 * Removes the em dash from a reply.
 *
 * The system prompts ask for this, but models reach for the em dash constantly
 * and instructions alone do not hold, so the text is corrected on the way out.
 * Only the em dash is touched: the en dash is left alone because it carries
 * meaning in numeric ranges such as "7-8 hours".
 */
function stripEmDashes(text) {
  return text
    // A spaced em dash joins two clauses, so a comma reads naturally.
    .replace(/\s*—\s*/g, ', ')
    // Tidy anything the substitution made awkward.
    .replace(/,\s*,/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/,\s*([.!?;:])/g, '$1')
    .replace(/([([])\s*,\s*/g, '$1')
    .replace(/,\s*$/gm, '');
}

/**
 * Sends a conversation to the active provider.
 * @param {{ system: string, messages: Array<{role: string, content: string}>, maxTokens?: number }} options
 * @returns {Promise<string>} the assistant's reply text
 */
async function ask({ system, messages, maxTokens }) {
  const provider = resolveProvider();
  if (!provider) {
    const err = new Error(
      'No AI provider is configured. Set GEMINI_API_KEY (free tier at aistudio.google.com) '
      + 'or ANTHROPIC_API_KEY on the server.',
    );
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
  const reply = await provider.complete({ system, messages, maxTokens });
  return stripEmDashes(reply);
}

/** Trims and normalises client-supplied history before it reaches a provider. */
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
