import 'dotenv/config';

export default ({ config }) => {
  const iosKey = process.env.MAPS_API_KEY_IOS || process.env.MAPS_API_KEY || '';
  const androidKey = process.env.MAPS_API_KEY_ANDROID || process.env.MAPS_API_KEY || '';
  const firebase = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  };
  const ai = {
    // WARNING: Do not ship real keys in production apps. Client-side keys can be extracted.
    // Use this only for local prototyping. Prefer a backend or Firebase Function proxy.
    geminiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  };

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      firebase,
      ai,
    },
    ios: {
      ...(config.ios || {}),
      config: {
        ...(config.ios?.config || {}),
        googleMapsApiKey: iosKey,
      },
    },
    android: {
      ...(config.android || {}),
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          ...(config.android?.config?.googleMaps || {}),
          apiKey: androidKey,
        },
      },
    },
  };
};