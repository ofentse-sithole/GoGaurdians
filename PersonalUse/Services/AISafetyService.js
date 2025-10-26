// Backend fallback removed; Gemini only (no offline heuristic)

/**
 * AI Safety Assistant Service
 * - assessThreatLevel: returns { threatLevel: 'LOW'|'MEDIUM'|'HIGH', advice: string }
 * - getGuidance: returns { guidance: string }
 *
 * This client uses Gemini directly via a key configured in Expo extras.
 * No offline heuristic fallback is provided. If the key is missing or a
 * response cannot be parsed, an error is thrown for the caller to handle.
 */

// Backend proxy support removed; no server calls here.

// South Africa–specific system-style guidance used in prompts
const SA_INSTRUCTIONS = `
You are a South Africa–aware safety assistant for civilians.
Tone: calm, clear, direct, and empathetic. Prefer short, actionable steps.

Context and terminology:
- Use South African terms (SAPS for police, EMS/ambulance, metro/fire).
- Emergency numbers in South Africa: 112 (from any mobile), 10111 (SAPS police), 10177 (ambulance/fire). If unsure, advise 112 from a mobile as a universal route.
- Encourage sharing live location with a trusted contact. Avoid confrontation; prioritise safety and distance.
- Do not give advanced medical or legal advice; give broadly safe first-aid and safety guidance. Prompt to call emergency services when risk is non-trivial.
- If guidance is location-sensitive, keep it generic and safe.
- Keep responses suitable for on-the-go reading. Use concise bullets.
`;

const getGeminiConfig = () => {
  try {
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const ai = extra?.ai ?? {};
    return { key: ai.geminiKey, model: ai.model || 'gemini-1.5-flash-latest' };
  } catch {
    return { key: null, model: null };
  }
};

function getModelCandidates(model) {
  if (!model) return [];
  const candidates = new Set();
  candidates.add(model);
  // If the model doesn't already specify a suffix, try common aliases.
  if (!/-latest$/.test(model)) candidates.add(`${model}-latest`);
  if (!/-\d{3}$/.test(model)) candidates.add(`${model}-001`);
  // Common public variants for 1.5 flash
  if (/gemini-1\.5-flash/.test(model)) {
    candidates.add('gemini-1.5-flash-latest');
    candidates.add('gemini-1.5-flash-001');
    candidates.add('gemini-1.5-flash-8b-latest');
    candidates.add('gemini-1.5-flash-8b');
  }
  return Array.from(candidates);
}

async function callGeminiJSON(prompt, { key, model }) {
  if (!key || !model) {
    const err = new Error('AI_UNAVAILABLE: Gemini API key/model not configured');
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }
  const candidates = getModelCandidates(model);
  let lastErr;
  const apiVersions = ['v1beta', 'v1'];
  for (const candidate of candidates) {
    for (const ver of apiVersions) {
      try {
        const url = `https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(candidate)}:generateContent`;
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SA_INSTRUCTIONS}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          response_mime_type: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      };
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          // If 404, try the next candidate or API version; else throw immediately
          if (res.status === 404) {
            lastErr = new Error(`Gemini HTTP 404 for model ${candidate} on ${ver}`);
            lastErr.code = 'AI_HTTP_ERROR_404';
            continue;
          }
          const err = new Error(`Gemini HTTP ${res.status}`);
          err.code = 'AI_HTTP_ERROR';
          throw err;
        }
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          const err = new Error('AI_RESPONSE_EMPTY');
          err.code = 'AI_RESPONSE_EMPTY';
          throw err;
        }
        try {
          return JSON.parse(text);
        } catch {
          return { freeText: text };
        }
      } catch (err) {
        // For non-404, bubble immediately
        if (err?.code && err.code !== 'AI_HTTP_ERROR_404') {
          console.warn('[AISafetyService] Gemini call failed:', err?.message || err);
          throw err;
        }
        // else keep trying next version or candidate
        lastErr = err;
      }
    }
  }
  // Exhausted candidates
  console.warn('[AISafetyService] Gemini models exhausted. Last error:', lastErr?.message || lastErr);
  throw lastErr || new Error('AI_MODEL_NOT_FOUND');
}

// No AI_ASSISTANCE_URL: removed per design (client-only Gemini + heuristic)

export async function assessThreatLevel(values) {
  const { surroundings, userInformation } = values;

  // Gemini-only path (prototype: key is exposed in client)
  const gemini = getGeminiConfig();
  console.log('[AISafetyService] Using Gemini for threat assessment (model:', gemini.model, ')');
  const prompt = `
Task: Read the user's brief description and classify threat as LOW, MEDIUM, or HIGH for a South African context.
Return JSON only with keys:
  - threatLevel: one of LOW | MEDIUM | HIGH
  - advice: short, actionable, 2-4 lines (bulleted with hyphens or line breaks)
Ensure advice references SA emergency options where appropriate (112 mobile; 10111 police; 10177 ambulance/fire).

Description: "${surroundings} ${userInformation || ''}"
`;
  const ai = await callGeminiJSON(prompt, gemini);
  if (ai && ai.threatLevel && ai.advice) {
    return { threatLevel: (ai.threatLevel || 'LOW').toUpperCase(), advice: ai.advice, source: 'gemini' };
  }
  // If the model returned free text or an invalid structure, signal error
  const err = new Error('AI_RESPONSE_INVALID: Missing threatLevel/advice');
  err.code = 'AI_RESPONSE_INVALID';
  throw err;
}

export async function getGuidance(values) {
  const { situation } = values;

  // Gemini-only path
  const gemini = getGeminiConfig();
  console.log('[AISafetyService] Using Gemini for guidance (model:', gemini.model, ')');
  const prompt = `
Task: The user describes an emergency in South Africa. Provide concise, step-by-step guidance (3–6 steps), suitable for on-the-go reading.
Return JSON exactly as: { "guidance": "multi-line bullet list" }
Rules: Use SA context. Where calling is needed, mention 112 (mobile), 10111 (police SAPS), or 10177 (ambulance/fire). Avoid advanced medical/legal specifics; keep advice broadly safe.

Emergency: "${situation}"
`;
  const ai = await callGeminiJSON(prompt, gemini);
  if (ai && ai.guidance) {
    return { guidance: ai.guidance };
  }
  const err = new Error('AI_RESPONSE_INVALID: Missing guidance');
  err.code = 'AI_RESPONSE_INVALID';
  throw err;
}

export default { assessThreatLevel, getGuidance };
