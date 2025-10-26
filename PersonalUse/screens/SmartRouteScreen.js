import { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, Linking, StatusBar, TextInput, ActivityIndicator, Animated, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PanicButton from '../Components/PanicButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Helper to reference imported symbols and satisfy strict no-unused-vars lint
function __use(..._args) { /* no-op */ }

// Simple haversine distance in km
const haversineKm = (a, b) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

const SmartRouteScreen = () => {
  // Reference imported JSX/Icons explicitly so ESLint recognizes usage across JSX
  __use(View, Text, TouchableOpacity, SafeAreaView, MapView, Marker, Polyline, MaterialIcons, Entypo, PanicButton, TextInput, ActivityIndicator, Animated, PanResponder);
  const navigation = useNavigation();
  const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
  const webKey = extra?.maps?.webKey || '';
  const mapRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [region, setRegion] = useState({
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recents, setRecents] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null); // { distanceText, durationText }
  const searchTimer = useRef(null);
  const sessionTokenRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [mode, setMode] = useState('walking'); // 'walking' | 'driving'
  // Bottom sheet drag state
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const COLLAPSED_OFFSET = useMemo(() => {
    // Collapse amount scales with device height (bounds: 200-360)
    const o = Math.round(Math.min(360, Math.max(200, SCREEN_HEIGHT * 0.33)));
    return o;
  }, [SCREEN_HEIGHT]);
  const EXPANDED_OFFSET = 0;
  const sheetOffset = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  // Ensure initial position respects collapsed offset
  useEffect(() => {
    sheetOffset.setValue(isExpanded ? EXPANDED_OFFSET : COLLAPSED_OFFSET);
  }, [COLLAPSED_OFFSET]);
  const animateSheet = (toExpanded) => {
    Animated.spring(sheetOffset, {
      toValue: toExpanded ? EXPANDED_OFFSET : COLLAPSED_OFFSET,
      useNativeDriver: true,
      damping: 15,
      stiffness: 120,
    }).start();
    setIsExpanded(toExpanded);
    // Persist last state
    AsyncStorage.setItem('@smartRoute.sheetExpanded', toExpanded ? '1' : '0').catch(() => {});
  };
  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        sheetOffset.stopAnimation((value) => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          COLLAPSED_OFFSET,
          Math.max(EXPANDED_OFFSET, dragStart.current + gesture.dy)
        );
        sheetOffset.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        // Treat a tiny movement as a tap to toggle
        const isTap = Math.abs(gesture.dy) < 5 && Math.abs(gesture.dx) < 5;
        if (isTap) {
          animateSheet(!isExpanded);
          return;
        }
        const shouldExpand = dragStart.current + gesture.dy < COLLAPSED_OFFSET / 2;
        animateSheet(shouldExpand);
      },
    })
  ).current;

  useEffect(() => {
    // Grab current location on mount to align with app's map-first UX
    (async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location needed', 'Enable location to plan a smart route.');
          setLoadingLocation(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setOrigin(coords);
        setRegion((r) => ({ ...r, ...coords }));
        setLoadingLocation(false);
      } catch {
        setLoadingLocation(false);
      }
    })();
    // Load recents
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@smartRoute.recents');
        if (raw) setRecents(JSON.parse(raw));
      } catch {}
    })();
    // Load last sheet state (expanded/collapsed)
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@smartRoute.sheetExpanded');
        const expanded = saved === '1';
        setIsExpanded(expanded);
        sheetOffset.setValue(expanded ? EXPANDED_OFFSET : COLLAPSED_OFFSET);
      } catch {}
    })();
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const line = useMemo(() => {
    if (!origin || !destination) return [];
    return [origin, destination]; // Straight-line fallback when Directions API not available
  }, [origin, destination]);

  const distanceKm = useMemo(() => {
    if (origin && destination) return haversineKm(origin, destination);
    return null;
  }, [origin, destination]);

  const estMinutesFallback = useMemo(() => {
    if (!distanceKm) return null;
    // Walking ~5 km/h -> 12 min/km; Driving ~30 km/h -> 2 min/km
    const perKm = mode === 'walking' ? 12 : 2;
    const minutes = Math.round(distanceKm * perKm);
    return Math.max(1, minutes);
  }, [distanceKm, mode]);

  const openExternalMap = () => {
    if (!destination) {
      Alert.alert('Pick destination', 'Long-press on the map to set where you want to go.');
      return;
    }
    const { latitude, longitude } = destination;
    const latLng = `${latitude},${longitude}`;
    const travelmode = mode === 'walking' ? 'walking' : 'driving';
    const appleDirFlg = mode === 'walking' ? 'w' : 'd';

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=${travelmode}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${latLng}&q=Destination&dirflg=${appleDirFlg}`;
    const wazeUrl = `https://waze.com/ul?ll=${latLng}&navigate=yes`;

    const options = [];
    if (Platform.OS === 'ios') {
      options.push({ label: 'Apple Maps', url: appleMapsUrl });
      options.push({ label: 'Google Maps', url: googleMapsUrl });
      options.push({ label: 'Waze', url: wazeUrl });
    } else {
      options.push({ label: 'Google Maps', url: googleMapsUrl });
      options.push({ label: 'Waze', url: wazeUrl });
    }

    Alert.alert(
      'Open Navigation',
      'Choose app to navigate with:',
      options.map((opt) => ({
        text: opt.label,
        onPress: () => Linking.openURL(opt.url).catch(() => {
          Alert.alert('Error', `${opt.label} not available on this device.`);
        }),
      }))
    );
  };

  // Debounced Places Autocomplete suggestions
  useEffect(() => {
    if (!webKey) return; // search disabled without key
    if (!query) {
      setSuggestions([]);
      setSearchError('');
      return;
    }
    setSearching(true);
    setSearchError('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set('input', query);
        params.set('key', webKey);
        params.set('types', 'geocode'); // addresses/places
        params.set('components', 'country:za');
        params.set('sessiontoken', sessionTokenRef.current);
        if (origin) {
          params.set('location', `${origin.latitude},${origin.longitude}`);
          params.set('radius', '20000'); // 20km bias
        }
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.status === 'OK') {
          setSuggestions(data.predictions || []);
        } else {
          setSuggestions([]);
          setSearchError(data?.error_message || data?.status || 'No results');
        }
      } catch {
        setSuggestions([]);
        setSearchError('Network error while searching');
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query, webKey, origin]);

  const onSelectSuggestion = async (pred) => {
    try {
      setShowSuggestions(false);
      setQuery(pred.description);
      if (!webKey) return;
      const params = new URLSearchParams();
      params.set('place_id', pred.place_id);
      params.set('fields', 'geometry,name');
      params.set('key', webKey);
      params.set('sessiontoken', sessionTokenRef.current);
      const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      const loc = data?.result?.geometry?.location;
      if (loc) {
        const coords = { latitude: loc.lat, longitude: loc.lng };
        setDestination(coords);
        await saveRecent({
          id: pred.place_id,
          name: data?.result?.name || pred.description,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        // rotate token after a successful selection
        sessionTokenRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
    } catch {}
  };

  const saveRecent = async (item) => {
    try {
      const next = [item, ...recents.filter((r) => r.id !== item.id)].slice(0, 8);
      setRecents(next);
      await AsyncStorage.setItem('@smartRoute.recents', JSON.stringify(next));
    } catch {}
  };

  const useRecent = async (r) => {
    setDestination({ latitude: r.latitude, longitude: r.longitude });
    setQuery(r.name);
    await saveRecent(r);
  };

  // Directions API: build polyline and ETA when web key present
  useEffect(() => {
    const fetchDirections = async () => {
      if (!webKey || !origin || !destination) {
        setRouteCoords([]);
        setRouteInfo(null);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.set('origin', `${origin.latitude},${origin.longitude}`);
        params.set('destination', `${destination.latitude},${destination.longitude}`);
        params.set('mode', mode);
        params.set('region', 'za');
        params.set('key', webKey);
        const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();
        const route = data?.routes?.[0];
        if (route?.overview_polyline?.points) {
          const coords = decodePolyline(route.overview_polyline.points);
          setRouteCoords(coords);
          const leg = route?.legs?.[0];
          setRouteInfo({
            distanceText: leg?.distance?.text || null,
            durationText: leg?.duration?.text || null,
          });
        } else {
          setRouteCoords([]);
          setRouteInfo(null);
        }
      } catch {
        setRouteCoords([]);
        setRouteInfo(null);
      }
    };
    fetchDirections();
  }, [origin, destination, webKey, mode]);

  const fitMap = () => {
    if (!mapRef.current) return;
    const points = (routeCoords?.length >= 2 ? routeCoords : [origin, destination]).filter(Boolean);
    if (points.length >= 2) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 80, bottom: COLLAPSED_OFFSET + 40, left: 40, right: 40 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    fitMap();
  }, [destination, routeCoords]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FA" />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        onLongPress={(e) => setDestination(e.nativeEvent.coordinate)}
      >
        {origin && (
          <Marker coordinate={origin} title="Start" pinColor="#007AFF" />
        )}
        {destination && (
          <Marker coordinate={destination} title="Destination" />
        )}
        {(routeCoords.length >= 2 ? routeCoords : line).length >= 2 && (
          <Polyline
            coordinates={routeCoords.length >= 2 ? routeCoords : line}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Route</Text>
        <View style={styles.headerButtonSpacer} />
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetOffset }] }]}>
        <View style={styles.sheetHandle} {...panResponder.panHandlers} />
        {/* Search row */}
        <View style={styles.searchRow}>
          <MaterialIcons name="place" size={20} color="#007AFF" />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setShowSuggestions(true);
            }}
            placeholder={webKey ? 'Search destination' : 'Long-press map to set destination'}
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            onFocus={() => setShowSuggestions(true)}
          />
          {query?.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
              <MaterialIcons name="cancel" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions / Recents panel */}
        {showSuggestions && (
          <View style={styles.suggestionsPanel}>
            {!!searchError && (
              <View style={styles.suggestionErrorRow}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={styles.suggestionErrorText} numberOfLines={2}>{searchError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => {
                  if (webKey && query) {
                    setSearching(true);
                    setSearchError('');
                    // immediate retry with current query
                    (async () => {
                      try {
                        const params = new URLSearchParams();
                        params.set('input', query);
                        params.set('key', webKey);
                        params.set('types', 'geocode');
                        params.set('components', 'country:za');
                        params.set('sessiontoken', sessionTokenRef.current);
                        if (origin) {
                          params.set('location', `${origin.latitude},${origin.longitude}`);
                          params.set('radius', '20000');
                        }
                        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
                        const res = await fetch(url);
                        const data = await res.json();
                        if (data?.status === 'OK') {
                          setSuggestions(data.predictions || []);
                        } else {
                          setSuggestions([]);
                          setSearchError(data?.error_message || data?.status || 'No results');
                        }
                      } catch {
                        setSuggestions([]);
                        setSearchError('Network error while searching');
                      } finally {
                        setSearching(false);
                      }
                    })();
                  }
                }}>
                  <MaterialIcons name="refresh" size={16} color="#1F2937" />
                </TouchableOpacity>
              </View>
            )}
            {webKey ? (
              suggestions.length > 0 ? (
                suggestions.map((p) => (
                  <TouchableOpacity key={p.place_id} style={styles.suggestionItem} onPress={() => onSelectSuggestion(p)}>
                    <MaterialIcons name="location-on" size={18} color="#007AFF" />
                    <Text style={styles.suggestionText} numberOfLines={1}>{p.description}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.suggestionEmptyRow}>
                  {searching ? (
                    <ActivityIndicator color="#007AFF" />
                  ) : (
                    <Text style={styles.suggestionEmptyText}>Start typing to search places</Text>
                  )}
                </View>
              )
            ) : (
              <Text style={styles.keyHint}>Add a Google Places web key to enable search.</Text>
            )}
            {recents.length > 0 && (
              <View style={styles.recentsBlock}>
                <Text style={styles.recentsTitle}>Recent</Text>
                {recents.map((r) => (
                  <TouchableOpacity key={r.id} style={styles.suggestionItem} onPress={() => useRecent(r)}>
                    <MaterialIcons name="history" size={18} color="#6B7280" />
                    <Text style={styles.suggestionText} numberOfLines={1}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Powered by Google footer */}
            <View style={styles.poweredRow}>
              <Text style={styles.poweredText}>Powered by Google</Text>
            </View>
          </View>
        )}

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'walking' && styles.modeButtonActive]}
            onPress={() => setMode('walking')}
          >
            <MaterialIcons name="directions-walk" size={16} color={mode === 'walking' ? '#FFFFFF' : '#374151'} />
            <Text style={[styles.modeText, mode === 'walking' && styles.modeTextActive]}>Walk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'driving' && styles.modeButtonActive]}
            onPress={() => setMode('driving')}
          >
            <MaterialIcons name="directions-car" size={16} color={mode === 'driving' ? '#FFFFFF' : '#374151'} />
            <Text style={[styles.modeText, mode === 'driving' && styles.modeTextActive]}>Drive</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>
              {routeInfo?.distanceText || (distanceKm ? `${distanceKm.toFixed(2)} km` : '--')}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>ETA ({mode === 'walking' ? 'walk' : 'drive'})</Text>
            <Text style={styles.metricValue}>{routeInfo?.durationText || (estMinutesFallback ? `${estMinutesFallback} min` : '--')}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Preview only. For turn-by-turn directions, we open your maps app.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.navigateBtn, !destination && styles.btnDisabled]}
            onPress={openExternalMap}
            disabled={!destination}
          >
            <Entypo name="direction" size={18} color="#FFFFFF" />
            <Text style={styles.navigateText}>Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locateBtn}
            onPress={async () => {
              try {
                setLoadingLocation(true);
                const pos = await Location.getCurrentPositionAsync({});
                const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                setOrigin(coords);
                // Focus the map on the user's current location with a closer zoom
                const nextRegion = {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setRegion(nextRegion);
                if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
                  mapRef.current.animateToRegion(nextRegion, 500);
                }
                setLoadingLocation(false);
              } catch {
                setLoadingLocation(false);
                Alert.alert('Location error', 'Unable to fetch your current location.');
              }
            }}
          >
            <MaterialIcons name="my-location" size={18} color="#007AFF" />
            <Text style={styles.locateText}>{loadingLocation ? 'Locating…' : 'Use my location'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panicContainer}>
          <PanicButton onPress={() => Alert.alert('SOS', 'Emergency workflow coming from Home screen.')} />
          <Text style={styles.panicHint}>Press for emergency</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  map: { ...StyleSheet.absoluteFillObject },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonSpacer: { width: 44, height: 44 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },

  suggestionsPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  suggestionErrorText: { color: '#B91C1C', fontSize: 12, flex: 1 },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: { flex: 1, color: '#374151', fontSize: 14 },
  suggestionEmptyRow: { padding: 12, alignItems: 'center' },
  suggestionEmptyText: { color: '#6B7280', fontSize: 12 },
  keyHint: { color: '#6B7280', fontSize: 12, padding: 12 },
  recentsBlock: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 6 },
  recentsTitle: { color: '#6B7280', fontSize: 12, paddingHorizontal: 12, paddingBottom: 4 },
  poweredRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  poweredText: { color: '#9CA3AF', fontSize: 10 },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: { color: '#6B7280', fontSize: 12 },
  metricValue: { color: '#111827', fontSize: 16, fontWeight: '700', marginTop: 4 },

  noteBox: {
    backgroundColor: '#ECFEFF',
    borderColor: '#67E8F9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  noteText: { color: '#0E7490', fontSize: 12 },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
    marginRight: 10,
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  navigateText: { color: '#FFFFFF', fontWeight: '700' },

  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  locateText: { color: '#007AFF', fontWeight: '600' },

  panicContainer: { alignItems: 'center', marginTop: 14 },
  panicHint: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  modeTextActive: { color: '#FFFFFF' },
});

export default SmartRouteScreen;

// Polyline decoder (Google Encoded Polyline Algorithm Format)
function decodePolyline(encoded) {
  let index = 0;
  const len = encoded.length;
  const path = [];
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    path.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return path;
}