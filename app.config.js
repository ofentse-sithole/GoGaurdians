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
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  };
  const maps = {
    // Web services key used for Places Autocomplete and Directions HTTP APIs
    // Prefer MAPS_WEB_API_KEY if provided, otherwise fall back to MAPS_API_KEY
    webKey: process.env.MAPS_WEB_API_KEY || process.env.MAPS_API_KEY || '',
  };

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        'expo-location',
        {
          // These strings populate iOS permission dialogs via Info.plist
          locationWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to access your location to show your live position and share it with family members.',
          locationAlwaysAndWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to access your location even when the app is in the background to keep family members updated.',
        },
      ],
      'expo-image-picker',
    ],
    extra: {
      ...(config.extra || {}),
      firebase,
      ai,
      maps,
    },
    ios: {
      ...(config.ios || {}),
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSLocationWhenInUseUsageDescription:
          'This app uses your location to show your live position and share it with family members for safety features.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app may access your location in the background to keep your family updated about your safety.',
        UIBackgroundModes: Array.from(
          new Set([...(config.ios?.infoPlist?.UIBackgroundModes || []), 'location'])
        ),
        NSPhotoLibraryUsageDescription:
          'This app needs access to your photo library to let you upload a profile picture.',
        NSLocationTemporaryUsageDescriptionDictionary: {
          PreciseLocation:
            'We request precise location temporarily to provide accurate live updates for safety and family features.',
        },
      },
      config: {
        ...(config.ios?.config || {}),
        googleMapsApiKey: iosKey,
      },
    },
    android: {
      ...(config.android || {}),
      // Add explicit permissions to ensure foreground (and optional background) location works
      permissions: Array.from(
        new Set([
          ...(config.android?.permissions || []),
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_FINE_LOCATION',
          // Include background location if your app needs it; safe to keep for future
          'android.permission.ACCESS_BACKGROUND_LOCATION',
          'android.permission.FOREGROUND_SERVICE',
        ])
      ),
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