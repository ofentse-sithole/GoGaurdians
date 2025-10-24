import React from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Homepage from '../screens/Homepage';

const Tab = createBottomTabNavigator();

// Placeholder Screen Components for other tabs
const SmartRouteScreen = () => (
  <View style={styles.screen}>
    <MaterialIcons name="route" size={64} color="#00D9FF" />
    <Text style={styles.screenText}>Smart Route</Text>
    <Text style={styles.screenSubtext}>Coming soon</Text>
  </View>
);

const FamilyScreen = () => (
  <View style={styles.screen}>
    <MaterialIcons name="family-restroom" size={64} color="#00D9FF" />
    <Text style={styles.screenText}>Family & Contacts</Text>
    <Text style={styles.screenSubtext}>Coming soon</Text>
  </View>
);

const ReportsScreen = () => (
  <View style={styles.screen}>
    <MaterialIcons name="assessment" size={64} color="#00D9FF" />
    <Text style={styles.screenText}>Incident Reports</Text>
    <Text style={styles.screenSubtext}>Coming soon</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <MaterialIcons name="person" size={64} color="#00D9FF" />
    <Text style={styles.screenText}>My Profile</Text>
    <Text style={styles.screenSubtext}>Coming soon</Text>
  </View>
);

const PersonalBottomNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let IconComponent = MaterialIcons;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outlined';
              break;
            case 'SmartRoute':
              iconName = focused ? 'route' : 'route';
              break;
            case 'Family':
              iconName = focused ? 'family-restroom' : 'family-restroom';
              break;
            case 'Reports':
              iconName = focused ? 'assessment' : 'assessment';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <IconComponent name={iconName} size={26} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          const labels = {
            'Home': 'Home',
            'SmartRoute': 'Route',
            'Family': 'Family',
            'Reports': 'Reports',
            'Profile': 'Profile',
          };
          return (
            <Text style={[
              styles.tabLabel,
              { color, fontWeight: focused ? '700' : '500' }
            ]}>
              {labels[route.name]}
            </Text>
          );
        },
        tabBarActiveTintColor: '#00D9FF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#0F1419',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 217, 255, 0.1)',
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 8,
          paddingHorizontal: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: 8,
          paddingHorizontal: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Homepage}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="SmartRoute" 
        component={SmartRouteScreen}
        options={{
          tabBarLabel: 'Route',
        }}
      />
      <Tab.Screen 
        name="Family" 
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Family',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1419',
    paddingHorizontal: 20,
  },
  screenText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 0.3,
  },
  screenSubtext: {
    fontSize: 14,
    color: '#A0AFBB',
    marginTop: 8,
    fontWeight: '500',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default PersonalBottomNavigation;