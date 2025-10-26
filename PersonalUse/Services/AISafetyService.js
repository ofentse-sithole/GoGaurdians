// Backend fallback removed; Gemini (if configured) + heuristic only

/**
 * AI Safety Assistant Service
 * - assessThreatLevel: returns { threatLevel: 'LOW'|'MEDIUM'|'HIGH', advice: string }
 * - getGuidance: returns { guidance: string }
 *
 * This client uses Gemini directly if a key is configured via Expo extras;
 * otherwise it falls back to a local heuristic.
 */

// Backend proxy support removed; no server calls here.

const getGeminiConfig = () => {
  try {
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const ai = extra?.ai ?? {};
    return { key: ai.geminiKey, model: ai.model || 'gemini-1.5-flash' };
  } catch {
    return { key: null, model: null };
  }
};

async function callGeminiJSON(prompt, { key, model }) {
  if (!key || !model) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // If model ignored JSON request, try to coerce minimal shape
      return { guidance: text };
    }
  } catch (err) {
    console.warn('[AISafetyService] Gemini call failed:', err?.message || err);
    return null;
  }
}

// No AI_ASSISTANCE_URL: removed per design (client-only Gemini + heuristic)

export async function assessThreatLevel(values) {
  const { surroundings, userInformation } = values;

  // Try Gemini client-only path if configured (prototype only; key is exposed in client)
  const gemini = getGeminiConfig();
  if (gemini.key) {
    console.log('[AISafetyService] Using Gemini for threat assessment (model:', gemini.model, ')');
    const prompt = `You are an AI safety assistant. Read the user's brief description and classify threat as LOW, MEDIUM, or HIGH. Reply in JSON only with keys: threatLevel (LOW|MEDIUM|HIGH) and advice (short, actionable, 2-4 lines).\n\nDescription: "${surroundings} ${userInformation || ''}"`;
    const ai = await callGeminiJSON(prompt, gemini);
    if (ai && ai.threatLevel && ai.advice) {
      return { threatLevel: (ai.threatLevel || 'LOW').toUpperCase(), advice: ai.advice, source: 'gemini' };
    }
  }

  // No backend path; fall through to heuristic if Gemini not available

  // Heuristic fallback
  const text = `${surroundings} ${userInformation || ''}`.toLowerCase();
  const highSignals = ['weapon', 'gun', 'knife', 'shots', 'fire', 'explosion', 'attack', 'assault', 'threaten', 'blood'];
  const mediumSignals = ['dark', 'alley', 'alone', 'shouting', 'crowd', 'aggressive', 'following', 'suspicious'];

  let score = 0;
  highSignals.forEach(k => { if (text.includes(k)) score += 3; });
  mediumSignals.forEach(k => { if (text.includes(k)) score += 1; });

  let threatLevel = 'LOW';
  if (score >= 4) threatLevel = 'HIGH';
  else if (score >= 2) threatLevel = 'MEDIUM';

  const adviceByLevel = {
    LOW: [
      'Stay aware of your surroundings and keep your phone accessible.',
      'Share your live location with a trusted contact if you feel uneasy.',
    ],
    MEDIUM: [
      'Move to a well-lit, populated area immediately.',
      'Avoid confrontation; increase distance from suspicious individuals or groups.',
      'Call a trusted contact and let them know your location.',
    ],
    HIGH: [
      'Call emergency services immediately.',
      'Find the nearest safe public place (store, station, police).',
      'If in immediate danger, make noise to attract attention.',
    ],
  };

  return {
    threatLevel,
    advice: adviceByLevel[threatLevel].join('\n• '),
    source: 'heuristic',
  };
}

export async function getGuidance(values) {
  const { situation } = values;

  // Try Gemini client-only path if configured
  const gemini = getGeminiConfig();
  if (gemini.key) {
    console.log('[AISafetyService] Using Gemini for guidance (model:', gemini.model, ')');
    const prompt = `You are an AI safety assistant. The user describes an emergency. Provide concise, step-by-step guidance (3-6 steps). Reply as JSON: { "guidance": "multi-line bullet list" }.\n\nEmergency: "${situation}"`;
    const ai = await callGeminiJSON(prompt, gemini);
    if (ai && ai.guidance) {
      return { guidance: ai.guidance };
    }
  }

  // No backend path; fall through to heuristic if Gemini not available

  const text = (situation || '').toLowerCase();

  if (text.includes('fire')) {
    return {
      guidance: [
        'Evacuate immediately; do not use elevators.',
        'Stay low to avoid smoke; cover nose and mouth.',
        'Once outside, call emergency services and move to a safe distance.',
      ].join('\n- '),
    };
  }

  if (text.includes('heart attack') || text.includes('cardiac') || text.includes('unconscious')) {
    return {
      guidance: [
        'Call emergency services immediately.',
        'If trained, begin CPR: 100-120 compressions per minute in the center of the chest.',
        'Use an AED if available and follow voice prompts.',
      ].join('\n- '),
    };
  }

  if (text.includes('assault') || text.includes('attack') || text.includes('threat')) {
    return {
      guidance: [
        'Move to a safe, visible, and populated area.',
        'Avoid confrontation and create distance; use your voice to draw attention if needed.',
        'Call emergency services and provide your location.',
      ].join('\n- '),
    };
  }

  return {
    guidance: [
      'Stay calm and move to a safe location.',
      'If possible, contact a trusted person and share your live location.',
      'Call emergency services if you feel in danger.',
    ].join('\n- '),
  };
}

export default { assessThreatLevel, getGuidance };
