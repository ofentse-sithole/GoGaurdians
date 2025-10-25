import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SmartRouteScreen = () => {
  const [activeRoute, setActiveRoute] = useState(null);
  const [routes] = useState([
    {
      id: 1,
      name: 'Safest Route',
      time: '12 min',
      distance: '2.4 km',
      type: 'recommended',
      safetyScore: 95,
      incidents: 0,
      description: 'Well-lit streets, high police presence',
    },
    {
      id: 2,
      name: 'Quickest Route',
      time: '8 min',
      distance: '1.9 km',
      type: 'fast',
      safetyScore: 72,
      incidents: 2,
      description: 'Some industrial areas',
    },
    {
      id: 3,
      name: 'Scenic Route',
      time: '15 min',
      distance: '3.1 km',
      type: 'scenic',
      safetyScore: 88,
      incidents: 1,
      description: 'Through parks and main streets',
    },
  ]);

  const [savedLocations] = useState([
    { id: 1, name: 'Home', icon: '🏠', distance: '1.2 km away' },
    { id: 2, name: 'Work', icon: '💼', distance: '2.5 km away' },
    { id: 3, name: 'Hospital', icon: '🏥', distance: '0.8 km away' },
  ]);

  const selectRoute = (route) => {
    setActiveRoute(route.id);
    Alert.alert('Route Selected', `Starting ${route.name}\nEstimated time: ${route.time}`);
  };

  const getSafetyColor = (score) => {
    if (score >= 90) return '#00D9FF';
    if (score >= 70) return '#FFB800';
    return '#FF6B6B';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="route" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Smart Route</Text>
            <Text style={styles.headerSubtitle}>Safe navigation planning</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Location Info */}
        <View style={styles.currentLocationCard}>
          <View style={styles.locationHeader}>
            <MaterialIcons name="my-location" size={20} color="#00D9FF" />
            <Text style={styles.locationTitle}>Current Location</Text>
          </View>
          <Text style={styles.locationAddress}>123 Main Street, Downtown District</Text>
          <View style={styles.safetyStatus}>
            <View style={styles.safetyIndicator} />
            <Text style={styles.safetyText}>Area Safety: HIGH</Text>
          </View>
        </View>

        {/* Quick Destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Destinations</Text>
          <View style={styles.destinationsGrid}>
            {savedLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.destinationCard}
                onPress={() => Alert.alert('Navigate', `Starting route to ${location.name}`)}
              >
                <Text style={styles.destinationIcon}>{location.icon}</Text>
                <Text style={styles.destinationName}>{location.name}</Text>
                <Text style={styles.destinationDistance}>{location.distance}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Route Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Routes</Text>
          
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeCard,
                activeRoute === route.id && styles.routeCardActive,
              ]}
              onPress={() => selectRoute(route)}
            >
              {route.type === 'recommended' && (
                <View style={styles.recommendedBadge}>
                  <MaterialIcons name="verified" size={14} color="#00D9FF" />
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}

              <View style={styles.routeHeader}>
                <View>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeDescription}>{route.description}</Text>
                </View>
                <View style={styles.routeMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={16} color="#A0AFBB" />
                    <Text style={styles.metaText}>{route.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="straighten" size={16} color="#A0AFBB" />
                    <Text style={styles.metaText}>{route.distance}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.routeFooter}>
                <View style={styles.safetyScore}>
                  <View
                    style={[
                      styles.scoreCircle,
                      { borderColor: getSafetyColor(route.safetyScore) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreText,
                        { color: getSafetyColor(route.safetyScore) },
                      ]}
                    >
                      {route.safetyScore}%
                    </Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreLabel}>Safety Score</Text>
                    <Text style={styles.scoreIncidents}>
                      {route.incidents} incident{route.incidents !== 1 ? 's' : ''} reported
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => selectRoute(route)}
                >
                  <MaterialIcons name="arrow-forward" size={18} color="#000000" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation Safety Tips</Text>
          
          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb" size={20} color="#FFB800" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Stay Alert</Text>
              <Text style={styles.tipText}>Keep your phone visible but secure. Share your location with trusted contacts.</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <MaterialIcons name="phone" size={20} color="#FFB800" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Emergency Access</Text>
              <Text style={styles.tipText}>Your emergency contacts are just one tap away during navigation.</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <MaterialIcons name="visibility" size={20} color="#FFB800" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Visibility</Text>
              <Text style={styles.tipText}>Routes prioritize well-lit areas and main streets when possible.</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const RouteCard = ({ children, ...props }) => {
  return <View {...props}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentLocationCard: {
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  safetyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D9FF',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  destinationsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  destinationCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  destinationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  destinationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  destinationDistance: {
    fontSize: 11,
    color: '#A0AFBB',
  },
  routeCard: {
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 217, 255, 0.1)',
  },
  routeCardActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.12)',
    borderColor: 'rgba(0, 217, 255, 0.4)',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D9FF',
  },
  routeHeader: {
    marginBottom: 16,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 12,
    color: '#A0AFBB',
  },
  routeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#A0AFBB',
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 217, 255, 0.1)',
  },
  safetyScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AFBB',
  },
  scoreIncidents: {
    fontSize: 11,
    color: '#FFB800',
    marginTop: 2,
  },
  startButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#A0AFBB',
    lineHeight: 18,
  },
  spacer: {
    height: 20,
  },
});

export default SmartRouteScreen;
