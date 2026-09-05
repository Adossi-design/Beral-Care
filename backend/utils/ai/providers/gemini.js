// Google Gemini through AI Studio, the default provider because its free tier
// covers what this project needs. Uses the REST API directly rather than the
// SDK to keep the dependency list short.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const id = 'gemini';

const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

const model = () => process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Flash models reason before answering and those tokens count against this
// limit, so a low ceiling returns an empty reply. Reasoning cannot be capped.
const DEFAULT_MAX_TOKENS = 2048;

const isConfigured = () => Boolean(apiKey());

// Gemini calls the assistant turn "model" and takes the system prompt separately
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
    // Ordinary health questions trip the stricter defaults, so these are set as
    // low as the API allows. The clinical limits live in the system prompt.
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
