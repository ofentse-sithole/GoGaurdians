import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * MockMapView Component
 * 
 * This is a placeholder map component that works with Expo.
 * Replaces react-native-maps for development/preview.
 * In production, replace with actual MapView from react-native-maps.
 */

const MockMapView = React.forwardRef(({
  style,
  region,
  onRegionChange,
  showsUserLocation,
  followsUserLocation,
  zoomEnabled,
  scrollEnabled,
  pitchEnabled,
  children,
  ...props
}, ref) => {
  return (
    <View style={[styles.container, style]} {...props}>
      {/* Map background */}
      <View style={styles.mapBackground}>
        <View style={styles.gridContainer}>
          {/* Decorative grid pattern */}
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { height: '100%', width: 2 }]} />
        </View>

        {/* Map header info */}
        <View style={styles.mapHeader}>
          <Text style={styles.mapHeaderText}>📍 Live Map</Text>
          <Text style={styles.mapSubtextText}>
            {region?.latitude?.toFixed(4)}, {region?.longitude?.toFixed(4)}
          </Text>
        </View>

        {/* Center marker (user location) */}
        {showsUserLocation && (
          <View style={styles.centerMarkerContainer}>
            <View style={styles.pulseRing1} />
            <View style={styles.pulseRing2} />
            <View style={styles.centerMarker}>
              <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
            </View>
          </View>
        )}

        {/* Zoom controls indicator */}
        <View style={styles.zoomControls}>
          <Text style={styles.zoomText}>{zoomEnabled ? '🔍' : '—'}</Text>
        </View>

        {/* Render map markers (children) */}
        <View style={styles.markersContainer}>
          {children}
        </View>

        {/* Footer info */}
        <View style={styles.mapFooter}>
          <Text style={styles.footerText}>
            {followsUserLocation ? '👁️ Following' : '🗺️ Map View'}
          </Text>
        </View>
      </View>
    </View>
  );
});

// Marker component to replace MapView.Marker
export const Marker = ({
  coordinate,
  title,
  pinColor,
  description,
  children,
  onPress,
}) => {
  // Calculate approximate position on screen
  // This is a simplified representation
  return (
    <View style={styles.markerWrapper}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor: pinColor || '#FF6B6B',
          },
        ]}
        onTouchEnd={onPress}
      >
        <MaterialIcons name="location-on" size={24} color="#FFFFFF" />
      </View>
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapBackground: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#000000',
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    zIndex: 5,
  },
  mapHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mapSubtextText: {
    color: '#B0C4DE',
    fontSize: 12,
  },
  centerMarkerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100,
    zIndex: 10,
  },
  pulseRing1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  pulseRing2: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.5)',
  },
  centerMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 20,
  },
  markersContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerWrapper: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerTitle: {
    marginTop: 8,
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapFooter: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    zIndex: 5,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

MockMapView.displayName = 'MockMapView';

export default MockMapView;
