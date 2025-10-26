const SA_INSTRUCTIONS = `
You are a South Africa–aware safety assistant for civilians.
Tone: calm, clear, direct, and empathetic. Prefer short, actionable steps.

Context and terminology:
- Use South African terms (SAPS for police, EMS/ambulance, metro/fire).
- Emergency numbers in South Africa: 112 (mobile), 10111 (SAPS police), 10177 (ambulance/fire).
- Encourage sharing live location with a trusted contact. Avoid confrontation; prioritise safety.
- Do not give advanced medical or legal guidance; keep advice broadly safe and actionable.
- Keep responses easy to read on the move (short lines, bullets).
`;

const getGeminiConfig = () => {
  try {
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const ai = extra?.ai ?? {};
    return {
      key: ai.geminiKey || null,
      model: ai.model || 'gemini-2.0-flash'
    };
  } catch {
    return { key: null, model: null };
  }
};

function getModelCandidates(model) {
  if (!model) return [];
  const variants = new Set([model]);

  if (!/-latest$/.test(model)) variants.add(`${model}-latest`);
  if (!/-\d{3}$/.test(model)) variants.add(`${model}-001`);

  if (/gemini-2\.5-flash/.test(model)) {
    variants.add('gemini-2.5-flash-8b');
    variants.add('gemini-2.5-flash-latest');
    variants.add('gemini-2.5-flash-001');
  }
  if (/gemini-2\.0-flash/.test(model)) {
    variants.add('gemini-2.0-flash-latest');
    variants.add('gemini-2.0-flash-001');
    // Conservative cross-family fallbacks if 2.0 is unavailable
    variants.add('gemini-2.5-flash-latest');
    variants.add('gemini-1.5-flash-latest');
  }

  return [...variants];
}

async function callGeminiJSON(prompt, { key, model /*, schema*/}) {
  if (!key || !model) {
    const err = new Error('AI_UNAVAILABLE: Gemini API key/model missing');
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }

  const candidates = getModelCandidates(model);
  const apiVersions = ['v1beta', 'v1'];
  let lastError;

  for (const candidate of candidates) {
    for (const ver of apiVersions) {
      try {
        const url = `https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(candidate)}:generateContent`;

        const body = {
          systemInstruction: {
            role: 'system',
            parts: [{ text: SA_INSTRUCTIONS }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
             maxOutputTokens: 500,
            // Prefer JSON for most models; for 2.0-flash (text-out), prefer plain text
            response_mime_type: /gemini-2\.0-flash/.test(candidate) ? "text/plain" : "application/json"
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
        });
        
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          if (res.status === 404) {
            lastError = new Error(`Model not found: ${candidate} (${ver})`);
            continue;
          }
          const e = new Error(`Gemini HTTP ${res.status}${errText ? ` – ${errText.slice(0, 200)}` : ''}`);
          e.code = res.status === 429 ? 'AI_RATE_LIMIT' : 'AI_HTTP_ERROR';
          throw e;
        }

        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('AI_RESPONSE_EMPTY');

        try {
          return JSON.parse(text);
        } catch {
          // Try to extract JSON from fenced code blocks or verbose text
          const match = text.match(/\{[\s\S]*\}/m);
          if (match) {
            try { return JSON.parse(match[0]); } catch {}
          }
          return { freeText: text }; // fallback text mode
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('AI_MODEL_NOT_FOUND');
}

export async function assessThreatLevel(values) {
  const { surroundings, userInformation } = values;
  const gemini = getGeminiConfig();
  console.log('[AISafetyService] Threat assessment using model:', gemini.model);

  const desc = `${surroundings || ''} ${userInformation || ''}`.trim().slice(0, 400);
  const prompt = `
Task: Based on the user's description, classify threat as LOW, MEDIUM, or HIGH.
Return JSON:
{
  "threatLevel": "LOW|MEDIUM|HIGH",
  "advice": "2–4 bullet points"
}
Do not include markdown or extra commentary.
Description: "${desc}"
`;

  const ai = await callGeminiJSON(prompt, { ...gemini });

  if (ai?.threatLevel && ai?.advice) {
    return {
      threatLevel: ai.threatLevel.toUpperCase(),
      advice: ai.advice,
      source: 'gemini'
    };
  }

  // Salvage if freeText returned: infer level and advice from text while staying AI-only
  if (ai?.freeText) {
    const txt = ai.freeText;
    const levelMatch = txt.match(/\b(LOW|MEDIUM|HIGH)\b/i);
    const threatLevel = (levelMatch ? levelMatch[1] : 'MEDIUM').toUpperCase();
    // If the model printed a label like "Threat Level: X", trim before advice
    const advice = txt.replace(/^[\s\S]*?\b(LOW|MEDIUM|HIGH)\b:?/i, '').trim() || txt;
    if (advice) {
      return { threatLevel, advice, source: 'gemini' };
    }
  }

  throw new Error('AI_RESPONSE_INVALID: Missing threatLevel/advice');
}

export async function getGuidance(values) {
  const { situation } = values;
  const gemini = getGeminiConfig();
  console.log('[AISafetyService] Guidance using model:', gemini.model);

  const situ = `${situation || ''}`.trim().slice(0, 400);
  const prompt = `
Task: Provide step-by-step emergency guidance (3-6 lines).
Return JSON: { "guidance": "bullet list" }
Do not include markdown or extra commentary.
Emergency: "${situ}"
`;

  const ai = await callGeminiJSON(prompt, { ...gemini, maxTokens: 300 });

  if (ai?.guidance) return { guidance: ai.guidance };
  if (ai?.freeText) return { guidance: ai.freeText };

  throw new Error('AI_RESPONSE_INVALID: Missing guidance');
}

export default {
  assessThreatLevel,
  getGuidance,
};
