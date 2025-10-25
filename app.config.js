import 'dotenv/config';

export default ({ config }) => {
  const iosKey = process.env.MAPS_API_KEY_IOS || process.env.MAPS_API_KEY || '';
  const androidKey = process.env.MAPS_API_KEY_ANDROID || process.env.MAPS_API_KEY || '';

  return {
    ...config,
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