/**
 * Google Gemini provider (Google AI Studio).
 *
 * Chosen as the default because the AI Studio free tier covers the volume this
 * platform needs without a billing account, which matters for a service being
 * run on trial credit.
 *
 * Uses the REST API through global fetch rather than the SDK — one fewer
 * dependency, and the request shape stays visible and easy to debug.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const id = 'gemini';

const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

const model = () => process.env.GEMINI_MODEL || 'gemini-3.6-flash';

/**
 * Current Gemini flash models reason before answering, and those reasoning
 * tokens are billed against maxOutputTokens. A 1024 ceiling can be consumed
 * entirely by reasoning, returning a successful response with empty content —
 * so the default leaves clear headroom for the reply itself.
 *
 * Capping reasoning is not an option: thinkingBudget: 0 is rejected outright,
 * and a small budget is treated as advisory rather than a hard limit.
 */
const DEFAULT_MAX_TOKENS = 2048;

const isConfigured = () => Boolean(apiKey());

/**
 * Gemini names the assistant turn "model" rather than "assistant", and carries
 * the system prompt in a dedicated field instead of a message.
 */
function toContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

async function complete({ system, messages, maxTokens = DEFAULT_MAX_TOKENS, temperature = 0.6 }) {
  const key = apiKey();
  if (!key) throw new Error('GEMINI_API_KEY is not set');

  const url = `${ENDPOINT}/${model()}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: toContents(messages),
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    // Health questions routinely trip conservative defaults ("what are the side
    // effects of this drug", "explain my diagnosis"). These are the least
    // restrictive settings the API allows, and the clinical guard rails live in
    // the system prompt where they can be reviewed.
    safetySettings: [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The AI provider timed out.');
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.error?.message || `HTTP ${response.status}`;
    const error = new Error(`Gemini request failed: ${detail}`);
    error.status = response.status;
    throw error;
  }

  const candidate = data?.candidates?.[0];

  // A response can come back with no text when the model declines to answer.
  if (!candidate || candidate.finishReason === 'SAFETY') {
    throw new Error('The assistant could not answer that. Try rephrasing the question.');
  }

  const text = (candidate.content?.parts || [])
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    // Distinguish "ran out of room" from a genuinely empty answer: the former
    // is a configuration problem an operator can fix, and says so.
    if (candidate.finishReason === 'MAX_TOKENS') {
      const thoughts = data?.usageMetadata?.thoughtsTokenCount;
      throw new Error(
        `The reply was cut off before any text was produced${thoughts ? ` (${thoughts} reasoning tokens used)` : ''}. `
        + 'Raise the token limit for this model.',
      );
    }
    throw new Error('The assistant returned an empty response.');
  }
  return text;
}

module.exports = { id, isConfigured, complete, model };
