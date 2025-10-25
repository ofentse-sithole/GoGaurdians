import axios from 'axios';

/**
 * AI Safety Assistant Service
 * - assessThreatLevel: returns { threatLevel: 'LOW'|'MEDIUM'|'HIGH', advice: string }
 * - getGuidance: returns { guidance: string }
 *
 * If a backend is available, set AI_ASSISTANT_URL and we will call:
 *  - POST `${AI_ASSISTANT_URL}/assess`
 *  - POST `${AI_ASSISTANT_URL}/guidance`
 * Otherwise we fall back to a local heuristic.
 */

const FALLBACK_AI = true;

const getEnvUrl = () => {
  // Try Expo extra (preferred), else hardcoded placeholder
  try {
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const ai = extra?.api?.ai ?? {};
    return ai.assistance;
  } catch (e) {
    return null;
  }
};

const AI_ASSISTANCE_URL = getEnvUrl() || 'http://localhost:3000/api/v1/ai/assistance';

export async function assessThreatLevel(values) {
  const { surroundings, userInformation } = values;

  if (!FALLBACK_AI && AI_ASSISTANCE_URL) {
    try {
      const { data } = await axios.post(`${AI_ASSISTANCE_URL}/assess`, {
        surroundings,
        userInformation,
      });
      return data;
    } catch (e) {
      // fall through to heuristic
    }
  }

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
  };
}

export async function getGuidance(values) {
  const { situation } = values;

  if (!FALLBACK_AI && AI_ASSISTANCE_URL) {
    try {
      const { data } = await axios.post(`${AI_ASSISTANCE_URL}/guidance`, { situation });
      return data;
    } catch (e) {
      // fall back
    }
  }

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
